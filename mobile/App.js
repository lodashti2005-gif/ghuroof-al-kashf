import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";


// The game itself is untouched: the iOS app loads the published web build.
const GAME_URL = "https://waralsalfa.com";

export default function App() {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const canGoBack = useRef(false);

  // Android hardware back button navigates inside the web game first.
  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack.current && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <WebView
          ref={webRef}
          source={{ uri: GAME_URL }}
          style={styles.web}
          originWhitelist={["*"]}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          keyboardDisplayRequiresUserAction={false}
          pullToRefreshEnabled={false}
          allowsBackForwardNavigationGestures
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          onLoadEnd={() => setLoading(false)}
          onShouldStartLoadWithRequest={(req) => {
            // mailto/tel/whatsapp تُفتح بتطبيقات النظام؛ بقية الروابط (بما فيها
            // صفحات الدفع) تبقى داخل التطبيق حتى لا يتأثر مسار الشراء.
            const url = req.url ?? "";
            const external =
              /^(mailto:|tel:|sms:|whatsapp:)/i.test(url) || /^https?:\/\/(wa\.me|api\.whatsapp\.com)/i.test(url);
            if (external) {
              void Linking.openURL(url);
              return false;
            }
            return true;
          }}
          onNavigationStateChange={(state) => {
            canGoBack.current = state.canGoBack;
          }}

        />
        {loading ? (
          <View style={styles.loader} pointerEvents="none">
            <ActivityIndicator size="large" color="#e6c07a" />
          </View>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0c0f" },
  web: { flex: 1, backgroundColor: "#0b0c0f" },
  loader: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0c0f",
  },
});
