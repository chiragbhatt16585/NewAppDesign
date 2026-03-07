import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../utils/ThemeContext';
import { getThemeColors } from '../utils/themeStyles';
import CommonHeader from '../components/CommonHeader';

type NodeType = 'question' | 'result';

interface FlowNodeOption {
  id: string;
  label: string;
  next: string;
}

interface FlowNode {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  options?: FlowNodeOption[];
}

interface FlowDefinition {
  id: string;
  title: string;
  nodes: Record<string, FlowNode>;
  startId: string;
}

const flowDefinitions: FlowDefinition[] = [
  {
    id: 'internet-not-working',
    title: 'Internet not working at all',
    startId: 'q-power',
    nodes: {
      'q-power': {
        id: 'q-power',
        type: 'question',
        title: 'Is the router/modem powered ON?',
        description: 'Check if any LED on the router/modem is glowing.',
        options: [
          { id: 'yes-power', label: 'Yes, it is ON', next: 'q-cables' },
          { id: 'no-power', label: 'No, it is OFF', next: 'r-power-on' },
        ],
      },
      'r-power-on': {
        id: 'r-power-on',
        type: 'result',
        title: 'Please power ON the device.',
        description:
          'Switch ON the router/modem and wait ~30 seconds for lights to stabilize. If it is already ON but no lights, check power adapter or socket.',
      },
      'q-cables': {
        id: 'q-cables',
        type: 'question',
        title: 'Are all cables (WAN/LAN) properly connected?',
        description:
          'Confirm that the internet (WAN) cable and LAN cables are firmly plugged in on both router and wall/switch side.',
        options: [
          { id: 'yes-cables', label: 'Yes, all cables are OK', next: 'q-leds' },
          { id: 'no-cables', label: 'No / not sure', next: 'r-fix-cables' },
        ],
      },
      'r-fix-cables': {
        id: 'r-fix-cables',
        type: 'result',
        title: 'Fix/secure the cables first.',
        description:
          'Reconnect loose cables and make sure connectors click into place. After fixing, test again.',
      },
      'q-leds': {
        id: 'q-leds',
        type: 'question',
        title: 'What is the WAN/Internet LED status?',
        description:
          'Check the WAN/Internet LED (often labelled WAN/Internet). Is it OFF or RED/Amber?',
        options: [
          { id: 'wan-down', label: 'OFF / RED / Amber', next: 'r-wan-down' },
          { id: 'wan-ok', label: 'Normal (Green / blinking)', next: 'q-reboot' },
        ],
      },
      'r-wan-down': {
        id: 'r-wan-down',
        type: 'result',
        title: 'WAN link appears down.',
        description:
          'The router is not getting internet from the provider. Please raise a ticket with your ISP so they can check the line or backend.',
      },
      'q-reboot': {
        id: 'q-reboot',
        type: 'question',
        title: 'Have you already rebooted the router/modem?',
        description:
          'If not done recently, power OFF the router, wait 30 seconds, then power ON and wait for all LEDs to stabilize.',
        options: [
          { id: 'reboot-done', label: 'Yes, I already rebooted', next: 'q-other-device' },
          { id: 'reboot-now', label: 'Not yet, I will reboot now', next: 'r-reboot' },
        ],
      },
      'r-reboot': {
        id: 'r-reboot',
        type: 'result',
        title: 'Reboot the router/modem.',
        description:
          'After rebooting and waiting ~30 seconds, check the internet again. If it still does not work, continue with the next questions.',
      },
      'q-other-device': {
        id: 'q-other-device',
        type: 'question',
        title: 'Does internet work on any other device?',
        description:
          'Test on another phone/laptop connected to the same Wi‑Fi to see if it is device-specific.',
        options: [
          { id: 'works-other', label: 'Yes, works on another device', next: 'r-device-issue' },
          { id: 'not-work-other', label: 'No, does not work anywhere', next: 'q-lan-test' },
        ],
      },
      'r-device-issue': {
        id: 'r-device-issue',
        type: 'result',
        title: 'Issue seems device-specific.',
        description:
          'Check Wi‑Fi/LAN settings, VPN, and firewall/antivirus on the affected device. You can also restart that device and forget/reconnect Wi‑Fi.',
      },
      'q-lan-test': {
        id: 'q-lan-test',
        type: 'question',
        title: 'Does wired (LAN) connection work?',
        description:
          'Connect a LAN cable from any spare LAN port on the router to your device and test internet.',
        options: [
          { id: 'lan-works', label: 'Yes, LAN works', next: 'r-wifi-issue' },
          { id: 'lan-not-work', label: 'No, LAN also does not work', next: 'r-raise-ticket' },
        ],
      },
      'r-wifi-issue': {
        id: 'r-wifi-issue',
        type: 'result',
        title: 'Wi‑Fi configuration/coverage issue.',
        description:
          'Since LAN works, Wi‑Fi is likely the problem. Check Wi‑Fi password, channel, and router placement (avoid corners/inside cupboards).',
      },
      'r-raise-ticket': {
        id: 'r-raise-ticket',
        type: 'result',
        title: 'Please raise a ticket with ISP.',
        description:
          'Power, cables, LEDs, and LAN have all been checked. This looks like a line/backend issue – raise a ticket with your ISP.',
      },
    },
  },
  {
    id: 'slow-speed',
    title: 'Slow internet speed',
    startId: 'q-speed-low',
    nodes: {
      'q-speed-low': {
        id: 'q-speed-low',
        type: 'question',
        title: 'Is your measured speed lower than plan speed?',
        description:
          'Run a speed test on fast.com or speedtest.net while other downloads are paused.',
        options: [
          { id: 'low-yes', label: 'Yes, speed is low', next: 'q-reboot-router' },
          { id: 'low-no', label: 'No, speed is OK', next: 'r-no-issue' },
        ],
      },
      'r-no-issue': {
        id: 'r-no-issue',
        type: 'result',
        title: 'Speed looks normal.',
        description:
          'Your test speed matches the plan. If you still feel slow, check specific apps/sites or devices.',
      },
      'q-reboot-router': {
        id: 'q-reboot-router',
        type: 'question',
        title: 'Did you reboot the router recently?',
        description: 'Power OFF → wait 30 seconds → power ON, then rerun the speed test.',
        options: [
          { id: 'reboot-done', label: 'Yes, rebooted already', next: 'q-heavy-usage' },
          { id: 'reboot-now', label: 'No, I will reboot now', next: 'r-reboot-router' },
        ],
      },
      'r-reboot-router': {
        id: 'r-reboot-router',
        type: 'result',
        title: 'Reboot and test again.',
        description:
          'After rebooting, run the speed test again. If speed is still low, continue with the next steps.',
      },
      'q-heavy-usage': {
        id: 'q-heavy-usage',
        type: 'question',
        title: 'Are other devices downloading/streaming heavily?',
        description:
          'Check if someone is streaming 4K video, downloading games, or running backups on other devices.',
        options: [
          { id: 'heavy-yes', label: 'Yes, heavy usage is running', next: 'r-limit-usage' },
          { id: 'heavy-no', label: 'No, nothing heavy', next: 'q-lan-vs-wifi' },
        ],
      },
      'r-limit-usage': {
        id: 'r-limit-usage',
        type: 'result',
        title: 'Limit heavy usage.',
        description:
          'Pause big downloads/streams on other devices and then test speed again on your device.',
      },
      'q-lan-vs-wifi': {
        id: 'q-lan-vs-wifi',
        type: 'question',
        title: 'Does speed improve on LAN (wired) connection?',
        description:
          'Connect your device to the router using a LAN cable and rerun the speed test.',
        options: [
          { id: 'lan-better', label: 'Yes, LAN is faster', next: 'r-wifi-signal' },
          { id: 'lan-same', label: 'No, LAN is also slow', next: 'q-limit-devices' },
        ],
      },
      'r-wifi-signal': {
        id: 'r-wifi-signal',
        type: 'result',
        title: 'Wi‑Fi signal/coverage issue.',
        description:
          'Keep router in an open, central place, away from metal/brick walls. Consider using 5 GHz or extenders for better Wi‑Fi.',
      },
      'q-limit-devices': {
        id: 'q-limit-devices',
        type: 'question',
        title: 'Have you limited the number of active devices?',
        description:
          'Too many devices sharing the same connection can reduce speed per device.',
        options: [
          { id: 'limited-yes', label: 'Yes, already limited', next: 'r-raise-ticket' },
          { id: 'limited-no', label: 'Not yet, I will limit now', next: 'r-limit-devices-action' },
        ],
      },
      'r-limit-devices-action': {
        id: 'r-limit-devices-action',
        type: 'result',
        title: 'Disconnect unused devices.',
        description:
          'Disconnect or pause Wi‑Fi on devices not in use and then retest the speed.',
      },
      'r-raise-ticket': {
        id: 'r-raise-ticket',
        type: 'result',
        title: 'Speed still slow? Raise a ticket.',
        description:
          'If speed is consistently low even after these checks, raise a ticket with your ISP to check line capacity and backend.',
      },
    },
  },
  {
    id: 'some-websites-not-opening',
    title: 'Some websites not opening',
    startId: 'q-browser',
    nodes: {
      'q-browser': {
        id: 'q-browser',
        type: 'question',
        title: 'Does the website open in another browser?',
        description: 'Try Chrome, Firefox, Edge, etc. on the same device.',
        options: [
          { id: 'browser-yes', label: 'Yes, it opens there', next: 'r-browser-issue' },
          { id: 'browser-no', label: 'No, it does not open', next: 'q-other-device' },
        ],
      },
      'r-browser-issue': {
        id: 'r-browser-issue',
        type: 'result',
        title: 'Browser-specific issue.',
        description:
          'Clear cache/cookies, disable problematic extensions, or update/reset the original browser.',
      },
      'q-other-device': {
        id: 'q-other-device',
        type: 'question',
        title: 'Does the same site open on another device?',
        description:
          'Test on another phone/laptop using the same Wi‑Fi connection.',
        options: [
          { id: 'other-yes', label: 'Yes, works on other device', next: 'r-device-specific' },
          { id: 'other-no', label: 'No, not working anywhere', next: 'q-dns-cache' },
        ],
      },
      'r-device-specific': {
        id: 'r-device-specific',
        type: 'result',
        title: 'Device-specific problem.',
        description:
          'Clear DNS cache and proxy/VPN settings on the affected device. Restart the device and try again.',
      },
      'q-dns-cache': {
        id: 'q-dns-cache',
        type: 'question',
        title: 'Have you cleared DNS cache (especially on Windows)?',
        description:
          'On Windows: open Command Prompt and run “ipconfig /flushdns”.',
        options: [
          { id: 'dns-yes', label: 'Yes, cleared DNS', next: 'q-firewall' },
          { id: 'dns-no', label: 'Not yet', next: 'r-dns-clear' },
        ],
      },
      'r-dns-clear': {
        id: 'r-dns-clear',
        type: 'result',
        title: 'Clear DNS cache and retry.',
        description:
          'After clearing DNS, wait a few seconds and try opening the site again.',
      },
      'q-firewall': {
        id: 'q-firewall',
        type: 'question',
        title: 'Have you tried disabling firewall/antivirus briefly?',
        description:
          'Sometimes security software blocks specific sites. Disable briefly only for testing.',
        options: [
          { id: 'fw-yes', label: 'Yes, I tried that', next: 'q-hotspot' },
          { id: 'fw-no', label: 'Not yet', next: 'r-firewall' },
        ],
      },
      'r-firewall': {
        id: 'r-firewall',
        type: 'result',
        title: 'Try temporarily disabling firewall/antivirus.',
        description:
          'If the site opens after disabling, add it to allowed sites and re‑enable security software.',
      },
      'q-hotspot': {
        id: 'q-hotspot',
        type: 'question',
        title: 'Does the site open via Mobile Hotspot?',
        description:
          'Turn on mobile data hotspot and connect your device, then test the same website.',
        options: [
          { id: 'hotspot-yes', label: 'Yes, works on hotspot', next: 'r-isp-block' },
          { id: 'hotspot-no', label: 'No, still not opening', next: 'r-website-issue' },
        ],
      },
      'r-isp-block': {
        id: 'r-isp-block',
        type: 'result',
        title: 'Possible ISP-level blocking/filtering.',
        description:
          'Since it works on hotspot but not on your broadband, contact your ISP support and share the website URL.',
      },
      'r-website-issue': {
        id: 'r-website-issue',
        type: 'result',
        title: 'Likely website/server issue.',
        description:
          'If it fails even on hotspot, the website itself may be down or blocked globally. Try again later or use a VPN (if allowed).',
      },
    },
  },
  {
    id: 'wifi-connected-no-internet',
    title: 'Wi‑Fi connected but no internet',
    startId: 'q-wifi-connected',
    nodes: {
      'q-wifi-connected': {
        id: 'q-wifi-connected',
        type: 'question',
        title: 'Is your device connected to Wi‑Fi but pages are not loading?',
        description:
          'Confirm that Wi‑Fi shows “Connected” and signal is OK, but browsing fails.',
        options: [
          { id: 'wifi-yes', label: 'Yes, connected but no internet', next: 'q-leds' },
          { id: 'wifi-no', label: 'No, I am not connected', next: 'r-connect-wifi' },
        ],
      },
      'r-connect-wifi': {
        id: 'r-connect-wifi',
        type: 'result',
        title: 'Connect to your Wi‑Fi first.',
        description:
          'Connect to your home Wi‑Fi with the correct password, then check if pages load.',
      },
      'q-leds': {
        id: 'q-leds',
        type: 'question',
        title: 'Is the Internet/WAN LED ON on the router?',
        description:
          'Check router LEDs – especially Internet/WAN. Is it normal (Green/active) or OFF/RED?',
        options: [
          { id: 'wan-off', label: 'OFF / RED / abnormal', next: 'r-wan-down' },
          { id: 'wan-on', label: 'Looks normal', next: 'q-forget-reconnect' },
        ],
      },
      'r-wan-down': {
        id: 'r-wan-down',
        type: 'result',
        title: 'WAN link appears down.',
        description:
          'Your router is not getting internet from ISP. Please raise a ticket with ISP to check the line.',
      },
      'q-forget-reconnect': {
        id: 'q-forget-reconnect',
        type: 'question',
        title: 'Have you tried forgetting and reconnecting the Wi‑Fi network?',
        description:
          'On your device, forget this Wi‑Fi network and reconnect by entering the password again.',
        options: [
          { id: 'forget-yes', label: 'Yes, I did that', next: 'q-restart-devices' },
          { id: 'forget-no', label: 'Not yet', next: 'r-forget' },
        ],
      },
      'r-forget': {
        id: 'r-forget',
        type: 'result',
        title: 'Forget and reconnect Wi‑Fi.',
        description:
          'After reconnecting successfully, test browsing again. If still no internet, restart router and device.',
      },
      'q-restart-devices': {
        id: 'q-restart-devices',
        type: 'question',
        title: 'Did you restart both router and your device?',
        description:
          'Power‑cycle the router and restart your phone/PC, then test.',
        options: [
          { id: 'restart-yes', label: 'Yes, already restarted', next: 'q-lan-test' },
          { id: 'restart-no', label: 'Not yet', next: 'r-restart' },
        ],
      },
      'r-restart': {
        id: 'r-restart',
        type: 'result',
        title: 'Restart devices and check again.',
        description:
          'After restarting router and device, if there is still no internet, test using a LAN cable.',
      },
      'q-lan-test': {
        id: 'q-lan-test',
        type: 'question',
        title: 'Does internet work on a wired (LAN) connection?',
        description:
          'Connect your device to the router with a LAN cable and test browsing.',
        options: [
          { id: 'lan-yes', label: 'Yes, LAN works', next: 'r-wifi-config' },
          { id: 'lan-no', label: 'No, LAN also fails', next: 'r-raise-ticket' },
        ],
      },
      'r-wifi-config': {
        id: 'r-wifi-config',
        type: 'result',
        title: 'Wi‑Fi configuration/driver issue.',
        description:
          'Since LAN works, focus on Wi‑Fi settings/driver on your device or wireless config on the router.',
      },
      'r-raise-ticket': {
        id: 'r-raise-ticket',
        type: 'result',
        title: 'Please raise a ticket with ISP.',
        description:
          'Both Wi‑Fi and LAN fail even after basic checks – likely a line/backend problem.',
      },
    },
  },
  {
    id: 'frequent-disconnections',
    title: 'Frequent disconnections',
    startId: 'q-cables',
    nodes: {
      'q-cables': {
        id: 'q-cables',
        type: 'question',
        title: 'Are all power/WAN/LAN cables tightly connected?',
        description:
          'Loose connectors can cause random drop‑outs.',
        options: [
          { id: 'cables-yes', label: 'Yes, all are tight', next: 'q-overheat' },
          { id: 'cables-no', label: 'No / not sure', next: 'r-fix-cables' },
        ],
      },
      'r-fix-cables': {
        id: 'r-fix-cables',
        type: 'result',
        title: 'Secure all cables.',
        description:
          'Firmly plug in all power, WAN, and LAN cables and ensure there is no physical damage.',
      },
      'q-overheat': {
        id: 'q-overheat',
        type: 'question',
        title: 'Is the router overheating or kept in a closed box?',
        description:
          'Touch the router – it should be warm, not extremely hot.',
        options: [
          { id: 'overheat-yes', label: 'Yes, quite hot / closed space', next: 'r-ventilate' },
          { id: 'overheat-no', label: 'No, temperature seems normal', next: 'q-firmware' },
        ],
      },
      'r-ventilate': {
        id: 'r-ventilate',
        type: 'result',
        title: 'Improve ventilation.',
        description:
          'Move the router to a well‑ventilated, open place and avoid stacking devices on top of it.',
      },
      'q-firmware': {
        id: 'q-firmware',
        type: 'question',
        title: 'Is router firmware up to date?',
        description:
          'If you know how, check the router admin page or contact ISP to confirm firmware is updated.',
        options: [
          { id: 'firmware-yes', label: 'Yes, it is updated', next: 'r-raise-ticket' },
          { id: 'firmware-no', label: 'Not sure / no', next: 'r-update-firmware' },
        ],
      },
      'r-update-firmware': {
        id: 'r-update-firmware',
        type: 'result',
        title: 'Update router firmware.',
        description:
          'Update via router admin page or ask ISP to push the latest firmware. If disconnections continue, raise a ticket.',
      },
      'r-raise-ticket': {
        id: 'r-raise-ticket',
        type: 'result',
        title: 'Line/backend issue likely.',
        description:
          'If drops still happen after cable/heat/firmware checks, contact ISP – there may be line noise or backend problems.',
      },
    },
  },
];

const TroubleshootingScreen = ({ navigation }: any) => {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const selectedFlow = selectedFlowId
    ? flowDefinitions.find(f => f.id === selectedFlowId) || null
    : null;

  const currentNode: FlowNode | null =
    selectedFlow && currentNodeId ? selectedFlow.nodes[currentNodeId] || null : null;

  const startFlow = (flowId: string) => {
    const flow = flowDefinitions.find(f => f.id === flowId);
    if (!flow) return;
    setSelectedFlowId(flow.id);
    setCurrentNodeId(flow.startId);
    setHistory([]);
  };

  const resetAll = () => {
    setSelectedFlowId(null);
    setCurrentNodeId(null);
    setHistory([]);
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
    setCurrentNodeId(prev);
  };

  const handleOptionPress = (option: FlowNodeOption) => {
    if (!currentNode) return;
    setHistory(prev => [...prev, currentNode.id]);
    setCurrentNodeId(option.next);
  };

  const renderFlowSelection = () => (
    <View style={styles.flowList}>
      {flowDefinitions.map(flow => (
        <TouchableOpacity
          key={flow.id}
          style={[styles.flowButton, { borderColor: colors.border, backgroundColor: colors.card }]}
          activeOpacity={0.8}
          onPress={() => startFlow(flow.id)}
        >
          <View style={styles.flowButtonLeft}>
            <Text style={[styles.flowButtonTitle, { color: colors.text }]}>{flow.title}</Text>
            <Text style={[styles.flowButtonSubtitle, { color: colors.textSecondary }]}>
              Tap to start guided questions
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCurrentStep = () => {
    if (!selectedFlow || !currentNode) return null;

    const isQuestion = currentNode.type === 'question';

    return (
      <View style={[styles.stepCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.stepFlowTitle, { color: colors.text }]}>
          {selectedFlow.title}
        </Text>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {currentNode.title}
        </Text>
        {currentNode.description ? (
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
            {currentNode.description}
          </Text>
        ) : null}

        {isQuestion && currentNode.options && (
          <View style={styles.optionsContainer}>
            {currentNode.options.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionButton, { borderColor: colors.border }]}
                activeOpacity={0.85}
                onPress={() => handleOptionPress(option)}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isQuestion && (
          <View style={styles.resultActions}>
            <Text style={[styles.resultHint, { color: colors.textSecondary }]}>
              Follow the above recommendation. You can go back or choose another issue type.
            </Text>
          </View>
        )}

        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={[styles.navButton, { borderColor: colors.border }]}
            onPress={goBackStep}
            activeOpacity={0.8}
          >
            <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>‹ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, { borderColor: colors.border }]}
            onPress={resetAll}
            activeOpacity={0.8}
          >
            <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>
              Start over
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CommonHeader navigation={navigation} />

      <View style={[styles.headerSection, { borderBottomColor: colors.border }]}>
        <View style={styles.headerPill}>
          <Text style={[styles.headerPillText, { color: colors.primary }]}>
            Smart Help
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Internet Troubleshooting
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tell us what is happening. We will ask you a few questions and show the best next step.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!selectedFlow && renderFlowSelection()}
        {selectedFlow && renderCurrentStep()}
      </ScrollView>
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
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  headerPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginBottom: 6,
  },
  headerPillText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  flowList: {
    marginTop: 18,
  },
  flowButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowButtonLeft: {
    flex: 1,
  },
  flowButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  flowButtonSubtitle: {
    fontSize: 13,
    opacity: 0.85,
  },
  flowButtonBadge: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  stepFlowTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  optionsContainer: {
    marginTop: 4,
  },
  optionButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 8,
  },
  optionText: {
    fontSize: 15,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navButtonText: {
    fontSize: 13,
  },
  resultActions: {
    marginTop: 8,
  },
  resultHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default TroubleshootingScreen;

