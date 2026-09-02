package app.codedump.tool

import android.os.Bundle
import androidx.activity.OnBackPressedCallback
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    private lateinit var webBackCallback: OnBackPressedCallback

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(CodeDumpNativePlugin::class.java)
        super.onCreate(savedInstanceState)

        webBackCallback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView = bridge?.webView
                if (webView == null) {
                    dispatchDefaultBack()
                    return
                }
                webView.evaluateJavascript(
                    "Boolean(window.__codeDumpHandleAndroidBack && window.__codeDumpHandleAndroidBack())"
                ) { handled ->
                    if (handled != "true") dispatchDefaultBack()
                }
            }
        }
        onBackPressedDispatcher.addCallback(this, webBackCallback)
    }

    private fun dispatchDefaultBack() {
        if (!::webBackCallback.isInitialized) {
            finish()
            return
        }
        webBackCallback.isEnabled = false
        onBackPressedDispatcher.onBackPressed()
        webBackCallback.isEnabled = true
    }
}
