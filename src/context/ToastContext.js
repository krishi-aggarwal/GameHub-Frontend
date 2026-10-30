import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import colors from '../theme/colors';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'error') => {
    if (!message) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ message: String(message), type });
    timerRef.current = setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const accent = toast?.type === 'success'
    ? colors.success
    : toast?.type === 'info'
      ? colors.primary
      : colors.danger;

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      <View style={styles.root}>
        {children}
        {toast && (
          <View pointerEvents="box-none" style={styles.overlay}>
            <Pressable
              accessibilityRole="alert"
              onPress={dismissToast}
              style={[styles.toast, { borderLeftColor: accent }]}
            >
              <Text style={styles.message}>{toast.message}</Text>
              <Text style={[styles.dismiss, { color: accent }]}>×</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 20,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 560,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#171B25',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  message: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 19,
  },
  dismiss: {
    marginLeft: 12,
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
});