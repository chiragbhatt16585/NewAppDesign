import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Platform,
  ImageSourcePropType,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';
import { resolveTroubleshootingImages } from '../config/troubleshooting-image-map';
import { getClientConfig } from '../config/client-config';
import { apiService } from '../services/api';
import sessionManager from '../services/sessionManager';
import { parseTroubleshootingRuntimeConfig } from '../utils/troubleshootingConfig';
import {
  TroubleshootingAnswer,
  TroubleshootingConfig,
  TroubleshootingFlow,
  TroubleshootingNode,
  TroubleshootingOption,
} from '../types/troubleshooting';

/** Flows/titles/steps load from selfcareFetchCrmRuntimeConfigs (not a bundled JSON file). */
const USER_SELF_DIAGNOSIS_CONFIG = 'user_self_diagnosis';

/** One row per unique step label (avoids duplicate "Check Router Power & Lights"). */
function formatAnswersForSummary(answers: TroubleshootingAnswer[]): string[] {
  const seen = new Set<string>();
  let stepNum = 0;
  const lines: string[] = [];
  answers.forEach(a => {
    const key = a.stepLabel?.trim() || a.nodeId;
    if (seen.has(key)) return;
    seen.add(key);
    stepNum += 1;
    const step = a.stepLabel ? `Step ${stepNum} - ${a.stepLabel}` : `Step ${stepNum}`;
    lines.push(`${step}: ${a.optionLabel}`);
  });
  return lines;
}

const TroubleshootingScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [config, setConfig] = useState<TroubleshootingConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<TroubleshootingAnswer[]>([]);
  const [ticketDescription, setTicketDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadRuntimeConfig = async () => {
      setConfigLoading(true);
      setConfigError(null);

      try {
        const apiData = await apiService.fetchCrmRuntimeConfigs(USER_SELF_DIAGNOSIS_CONFIG);
        const runtimeConfig = parseTroubleshootingRuntimeConfig(
          apiData,
          USER_SELF_DIAGNOSIS_CONFIG,
        );

        if (cancelled) return;

        if (!runtimeConfig) {
          setConfig(null);
          setConfigError('Self-diagnosis configuration is not available.');
          return;
        }

        setConfig(runtimeConfig);
      } catch (error: any) {
        if (cancelled) return;
        setConfig(null);
        setConfigError(error?.message || 'Failed to load self-diagnosis configuration.');
        console.warn('[Troubleshooting] selfcareFetchCrmRuntimeConfigs failed:', error);
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
        }
      }
    };

    loadRuntimeConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFlow: TroubleshootingFlow | null = useMemo(
    () => config?.flows.find(f => f.id === selectedFlowId) || null,
    [config, selectedFlowId],
  );

  const currentNode: TroubleshootingNode | null =
    selectedFlow && currentNodeId ? selectedFlow.nodes[currentNodeId] || null : null;

  const completedSteps = useMemo(() => {
    if (!selectedFlow) return [];
    const seen = new Set<string>();
    const items: { stepNum: number; label: string }[] = [];
    history.forEach(nodeId => {
      const node = selectedFlow.nodes[nodeId];
      const label = node?.stepLabel?.trim();
      if (!label || seen.has(label)) return;
      seen.add(label);
      items.push({ stepNum: items.length + 1, label });
    });
    return items;
  }, [history, selectedFlow]);

  const diagnosisSummaryText = useMemo(() => {
    if (!selectedFlow || answers.length === 0) return '';
    return [`Self-diagnosis: ${selectedFlow.title}`, ...formatAnswersForSummary(answers)].join(
      '\n',
    );
  }, [selectedFlow, answers]);

  useEffect(() => {
    if (currentNode?.type !== 'terminal' || !diagnosisSummaryText) return;
    setTicketDescription(prev => (prev.trim() ? prev : diagnosisSummaryText));
  }, [currentNodeId, currentNode?.type, diagnosisSummaryText]);

  const startFlow = (flowId: string) => {
    const flow = config?.flows.find(f => f.id === flowId);
    if (!flow) return;
    setSelectedFlowId(flow.id);
    setCurrentNodeId(flow.startId);
    setHistory([]);
    setAnswers([]);
    setTicketDescription('');
  };

  const resetAll = () => {
    setSelectedFlowId(null);
    setCurrentNodeId(null);
    setHistory([]);
    setAnswers([]);
    setTicketDescription('');
  };

  const goBackStep = () => {
    if (!selectedFlow) return;
    if (history.length === 0) {
      resetAll();
      return;
    }
    const newHistory = [...history];
    const prev = newHistory.pop() || null;
    setHistory(newHistory);
    setAnswers(prevAnswers => prevAnswers.slice(0, -1));
    setCurrentNodeId(prev);
  };

  const pushHistory = (nodeId: string) => {
    setHistory(prev => [...prev, nodeId]);
  };

  const handleOptionPress = (option: TroubleshootingOption) => {
    if (!currentNode || !selectedFlow) return;
    pushHistory(currentNode.id);
    setAnswers(prev => [
      ...prev,
      {
        nodeId: currentNode.id,
        stepLabel: currentNode.stepLabel,
        optionId: option.id,
        optionLabel: option.label,
      },
    ]);
    setCurrentNodeId(option.next);
  };

  const handleInstructionContinue = () => {
    if (!currentNode?.next) return;
    pushHistory(currentNode.id);
    setCurrentNodeId(currentNode.next);
  };

  const handleRaiseTicket = async () => {
    if (!selectedFlow || isSubmittingTicket) return;

    const summary =
      ticketDescription.trim() ||
      diagnosisSummaryText ||
      `Self-diagnosis: ${selectedFlow.title}`;

    try {
      setIsSubmittingTicket(true);

      const username = await sessionManager.getUsername();
      if (!username) {
        throw new Error('Username not found');
      }

      const formattedUsername = username.toLowerCase().trim();
      const realm = getClientConfig().clientId;
      const problem = {
        value: selectedFlow.id,
        label: selectedFlow.title,
      };

      const response = await apiService.submitComplaint(
        formattedUsername,
        problem,
        summary,
        realm,
      );

      if (response?.success) {
        Alert.alert('Success', response.message || 'Ticket created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Tickets'),
          },
        ]);
        return;
      }

      throw new Error(response?.message || 'Failed to create ticket');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const renderRaiseTicketButton = (showIcon = false) => (
    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
      activeOpacity={0.9}
      disabled={isSubmittingTicket}
      onPress={handleRaiseTicket}
    >
      {isSubmittingTicket ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {showIcon ? (
            <MaterialIcons name="add" size={22} color="#fff" style={{ marginRight: 6 }} />
          ) : null}
          <Text style={styles.primaryButtonText}>Raise a Ticket</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const isSuccessResult =
    currentNode?.type === 'result' && currentNode.action !== 'raise_ticket';

  const navigateToHome = () => {
    resetAll();
    let nav: typeof navigation | undefined = navigation;
    for (let depth = 0; depth < 6 && nav; depth += 1) {
      const routeNames: string[] | undefined = nav.getState?.()?.routeNames;
      if (routeNames?.includes('HomeMain')) {
        nav.navigate('HomeMain');
        return;
      }
      if (routeNames?.includes('Home')) {
        nav.navigate('Home', { screen: 'HomeMain' });
        return;
      }
      nav = nav.getParent?.();
    }
    navigation.navigate('Home');
  };

  const handleResolvedOk = () => {
    // Main happy paths (Figma Issue Resolved) → Home; other result screens → Help hub
    if (
      currentNode?.id === 'resolved' ||
      currentNode?.id === 'slow-resolved' ||
      currentNode?.id === 'disc-resolved' ||
      currentNode?.id === 'wifi-resolved' ||
      currentNode?.id === 'website-resolved' ||
      currentNode?.id === 'website-final-done'
    ) {
      navigateToHome();
    } else {
      resetAll();
    }
  };

  const renderStepImages = (node: TroubleshootingNode) => {
    const localSources = resolveTroubleshootingImages(node.images);
    const remoteSources: ImageSourcePropType[] =
      node.imageUrls?.map(url => ({ uri: url })) || [];
    const sources = [...localSources, ...remoteSources];
    if (!sources.length) return null;

    if (sources.length === 1) {
      return (
        <Image source={sources[0]} style={styles.stepImageSingle} resizeMode="contain" />
      );
    }

    return (
      <View style={styles.stepImageRow}>
        {sources.map((source, index) => (
          <Image
            key={`img-${index}`}
            source={source}
            style={styles.stepImageHalf}
            resizeMode="contain"
          />
        ))}
      </View>
    );
  };

  const renderProgressBar = (node: TroubleshootingNode) => {
    const total = node.totalSteps ?? 4;
    const current = node.stepIndex ?? 1;
    const completedCount = Math.max(0, current - 1);

    return (
      <View style={styles.progressRow}>
        <TouchableOpacity
          style={[styles.progressBackBtn, { borderColor: colors.border }]}
          onPress={goBackStep}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressSegments}>
          {Array.from({ length: total }).map((_, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum <= completedCount;
            const isCurrent = stepNum === current;
            return (
              <View
                key={`seg-${stepNum}`}
                style={[
                  styles.progressSegment,
                  isCompleted && { backgroundColor: colors.primary },
                  isCurrent && !isCompleted && {
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderColor: colors.primary,
                  },
                  !isCompleted && !isCurrent && {
                    backgroundColor: isDark ? '#3a3a3c' : '#e8e8ed',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const renderOptions = (node: TroubleshootingNode) => {
    if (!node.options?.length) return null;
    const isPair = node.options.length === 2;

    return (
      <View style={[styles.optionsContainer, isPair && styles.optionsRow]}>
        {node.options.map(option => {
          const button = (
            <TouchableOpacity
              style={[
                isPair ? styles.optionButtonHalf : styles.optionButtonFull,
                { borderColor: colors.primary },
              ]}
              activeOpacity={0.85}
              onPress={() => handleOptionPress(option)}
            >
              {isPair ? (
                <View style={styles.optionLabelWrap}>
                  <Text
                    style={[styles.optionTextPair, { color: colors.text }]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {option.label}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
              )}
              {option.showChevron ? (
                <MaterialIcons
                  name="chevron-right"
                  size={isPair ? 14 : 20}
                  color={colors.primary}
                  style={styles.optionChevron}
                />
              ) : null}
            </TouchableOpacity>
          );

          if (!isPair) {
            return <React.Fragment key={option.id}>{button}</React.Fragment>;
          }

          return (
            <View key={option.id} style={styles.optionHalfWrap}>
              {button}
            </View>
          );
        })}
      </View>
    );
  };

  const renderProgressCard = () => {
    if (!selectedFlow || !currentNode) return null;
    const showProgress = currentNode.stepIndex != null;

    return (
      <View style={[styles.card, styles.progressCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.flowHeading, { color: colors.text }]}>{selectedFlow.title}</Text>
        <View
          style={[
            styles.flowHeadingDivider,
            { backgroundColor: isDark ? '#8E8E93' : '#D1D1D6' },
          ]}
        />
        {currentNode.stepLabel && currentNode.stepIndex != null ? (
          <View
            style={[
              styles.stepPill,
              { backgroundColor: isDark ? '#48484a' : '#f2f2f5' },
            ]}
          >
            <Text style={[styles.stepPillText, { color: colors.primary }]}>
              Step {currentNode.stepIndex} - {currentNode.stepLabel}
            </Text>
          </View>
        ) : null}
        {showProgress ? renderProgressBar(currentNode) : null}
      </View>
    );
  };

  const renderTerminal = (node: TroubleshootingNode) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.contentTitle, { color: colors.text }]}>{node.title}</Text>
      {node.description ? (
        <Text style={[styles.contentDescription, { color: colors.textSecondary }]}>
          {node.description}
        </Text>
      ) : null}

      {renderStepImages(node)}

      {node.showCompletedSteps && completedSteps.length > 0 ? (
        <View style={styles.completedSection}>
          <Text style={[styles.completedHeading, { color: colors.text }]}>Steps completed</Text>
          {completedSteps.map(item => (
            <View key={`done-${item.label}`} style={styles.completedRow}>
              <Text style={[styles.completedLabel, { color: colors.textSecondary }]}>
                Step {item.stepNum} - {item.label}
              </Text>
              <MaterialIcons name="check-circle" size={20} color={colors.success || '#28a745'} />
            </View>
          ))}
        </View>
      ) : null}

      {node.allowDescription !== false ? (
        <TextInput
          style={[
            styles.descriptionInput,
            {
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: isDark ? '#1c1c1e' : '#f8f9fa',
            },
          ]}
          placeholder="Describe your problem"
          placeholderTextColor={colors.textTertiary}
          value={ticketDescription}
          onChangeText={setTicketDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      ) : null}

      {renderRaiseTicketButton(true)}
    </View>
  );

  const renderContentCard = () => {
    if (!selectedFlow || !currentNode) return null;

    if (currentNode.type === 'terminal') {
      return renderTerminal(currentNode);
    }

    const hasImages =
      (currentNode.images?.length ?? 0) > 0 || (currentNode.imageUrls?.length ?? 0) > 0;
    const descriptionLower = currentNode.description?.toLowerCase() ?? '';
    const isRecheckAfterImages =
      descriptionLower.includes('internet working now') ||
      descriptionLower.includes('connection stable');
    const postImageText = currentNode.postImageQuestion ?? (isRecheckAfterImages ? currentNode.description : undefined);
    const showDescriptionAfterImages =
      currentNode.type === 'question' && hasImages && !!postImageText;
    const showDescriptionBeforeImages =
      currentNode.type === 'question' &&
      !!currentNode.description &&
      !(isRecheckAfterImages && !currentNode.postImageQuestion);

    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.contentTitle, { color: colors.text }]}>{currentNode.title}</Text>
        {showDescriptionBeforeImages ? (
          <Text style={[styles.contentDescription, { color: colors.textSecondary }]}>
            {currentNode.description}
          </Text>
        ) : null}

        {renderStepImages(currentNode)}

        {showDescriptionAfterImages ? (
          <Text style={[styles.recheckQuestion, { color: colors.text }]}>
            {postImageText}
          </Text>
        ) : null}

        {currentNode.type === 'question' && renderOptions(currentNode)}

        {currentNode.type === 'instruction' ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.9}
            onPress={handleInstructionContinue}
          >
            <Text style={styles.primaryButtonText}>
              {currentNode.confirmLabel || 'Continue'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {currentNode.type === 'result' && currentNode.action === 'raise_ticket' ? (
          <View style={styles.resultActions}>{renderRaiseTicketButton()}</View>
        ) : null}
      </View>
    );
  };

  const renderResolvedModal = () => {
    if (!isSuccessResult || !currentNode) return null;

    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={handleResolvedOk}
      >
        <View style={styles.resolvedOverlay}>
          <View style={[styles.resolvedCard, { backgroundColor: colors.card }]}>
            <View style={styles.resolvedIconCircle}>
              <MaterialIcons name="check" size={40} color="#fff" />
            </View>
            <Text style={[styles.resolvedTitle, { color: colors.success || '#28a745' }]}>
              {currentNode.title}
            </Text>
            {currentNode.description ? (
              <Text style={[styles.resolvedMessage, { color: colors.textSecondary }]}>
                {currentNode.description}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[styles.resolvedOkButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.9}
              onPress={handleResolvedOk}
            >
              <Text style={styles.resolvedOkText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFlowSelection = () => {
    if (!config?.flows.length) return null;

    return (
    <View style={styles.hubSection}>
      <Text style={[styles.hubSectionTitle, { color: colors.primary }]}>{config.hubTitle}</Text>
      <View style={[styles.hubListCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {config.flows.map((flow, index) => (
          <React.Fragment key={flow.id}>
            {index > 0 ? (
              <View style={[styles.hubDivider, { backgroundColor: colors.border }]} />
            ) : null}
            <TouchableOpacity
              style={styles.hubListItem}
              activeOpacity={0.75}
              onPress={() => startFlow(flow.id)}
            >
              <Text style={[styles.hubListItemText, { color: colors.text }]}>{flow.title}</Text>
              <MaterialIcons name="chevron-right" size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
    </View>
    );
  };

  const handleHeaderBack = () => {
    if (selectedFlow) {
      goBackStep();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} onBackPress={handleHeaderBack} />

      {!selectedFlow ? (
        <View style={styles.screenTitleRow}>
          <Text style={[styles.screenTitle, { color: colors.primary }]}>
            {config?.screenTitle || 'Help'}
          </Text>
          <Text style={[styles.helpSubtitle, { color: colors.textSecondary }]}>
            Quick connection guidance
          </Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {configLoading && !selectedFlow ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        {!configLoading && configError && !selectedFlow ? (
          <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{configError}</Text>
          </View>
        ) : null}
        {!configLoading && !configError && !selectedFlow && renderFlowSelection()}
        {selectedFlow && !isSuccessResult ? (
          <>
            {renderProgressCard()}
            {renderContentCard()}
          </>
        ) : null}
      </ScrollView>
      {renderResolvedModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  screenTitleRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  helpSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  hubSection: {
    marginTop: 8,
  },
  hubSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  hubListCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  hubListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  hubListItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  hubDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  progressCard: {
    marginTop: 4,
  },
  flowHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  flowHeadingDivider: {
    height: 1,
    width: '100%',
    marginBottom: 8,
  },
  stepPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    minHeight: 36,
    justifyContent: 'center',
  },
  stepPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  progressSegments: {
    flex: 1,
    flexDirection: 'row',
  },
  progressSegment: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  contentDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  recheckQuestion: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  stepImageSingle: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  stepImageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepImageHalf: {
    flex: 1,
    height: 160,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 4,
  },
  optionsContainer: {
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionHalfWrap: {
    width: '48.5%',
    maxWidth: '48.5%',
    minWidth: 0,
  },
  optionButtonHalf: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: Platform.OS === 'ios' ? 4 : 6,
  },
  optionLabelWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonFull: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextPair: {
    width: '100%',
    fontSize: Platform.OS === 'ios' ? 11 : 12,
    lineHeight: Platform.OS === 'ios' ? 14 : 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionChevron: {
    marginLeft: 2,
    flexShrink: 0,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultActions: {
    marginTop: 8,
  },
  completedSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  completedHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completedLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 88,
    marginBottom: 14,
  },
  resolvedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  resolvedCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  resolvedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resolvedTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  resolvedMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  resolvedOkButton: {
    minWidth: 160,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  resolvedOkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TroubleshootingScreen;
