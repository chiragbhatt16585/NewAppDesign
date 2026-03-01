import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

let pendingNavigation:
  | {
      name: string;
      params?: Record<string, unknown>;
    }
  | null = null;

export function navigate(name: string, params?: Record<string, unknown>) {
  if (navigationRef.isReady()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigationRef.navigate(name as never, params as never);
  } else {
    pendingNavigation = {name, params};
  }
}

export function handlePendingNavigation() {
  if (navigationRef.isReady() && pendingNavigation) {
    const {name, params} = pendingNavigation;
    pendingNavigation = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigationRef.navigate(name as never, params as never);
  }
}

