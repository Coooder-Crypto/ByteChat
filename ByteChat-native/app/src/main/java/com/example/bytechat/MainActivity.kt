package com.example.bytechat

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.Manifest
import android.os.Build
import android.os.Environment
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.example.bytechat.ui.theme.ByteChatTheme
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var cameraUri: Uri? = null

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { _ -> }

    private val filePickerLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val data = result.data
            val results: Array<Uri>? = when {
                result.resultCode != Activity.RESULT_OK -> null
                data == null || data.data == null && data.clipData == null -> cameraUri?.let { arrayOf(it) }
                data.clipData != null -> {
                    val clip = data.clipData!!
                    Array(clip.itemCount) { i -> clip.getItemAt(i).uri }
                }
                else -> arrayOf(data.data!!)
            }
            fileCallback?.onReceiveValue(results)
            fileCallback = null
            cameraUri = null
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        requestMediaPermissions()
        setContent {
            ByteChatTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    ChatWebView()
                }
            }
        }
    }

    private fun createTempImageFile(): File {
        val timeStamp: String = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val storageDir: File = externalCacheDir
            ?: getExternalFilesDir(Environment.DIRECTORY_PICTURES)
            ?: cacheDir
        return File.createTempFile("JPEG_${timeStamp}_", ".jpg", storageDir)
    }

    private fun requestMediaPermissions() {
        val perms = mutableListOf(Manifest.permission.CAMERA)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            perms.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
        permissionLauncher.launch(perms.toTypedArray())
    }

    @Composable
    private fun ChatWebView() {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                WebView.setWebContentsDebuggingEnabled(true)
                WebView(context).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.allowFileAccess = true
                    settings.allowContentAccess = true
                    settings.allowFileAccessFromFileURLs = true
                    settings.allowUniversalAccessFromFileURLs = true
                    settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                    settings.mediaPlaybackRequiresUserGesture = false
                    webViewClient = WebViewClient()
                    webChromeClient = object : WebChromeClient() {
                        override fun onShowFileChooser(
                            webView: WebView?,
                            filePathCallback: ValueCallback<Array<Uri>>,
                            fileChooserParams: FileChooserParams
                        ): Boolean {
                            // keep reference
                            this@MainActivity.fileCallback?.onReceiveValue(null)
                            this@MainActivity.fileCallback = filePathCallback

                            // camera intent
                            val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).also { intent ->
                                val photoFile = runCatching { createTempImageFile() }.getOrNull()
                                if (photoFile != null) {
                                    cameraUri = FileProvider.getUriForFile(
                                        context,
                                        "${context.packageName}.fileprovider",
                                        photoFile
                                    )
                                    intent.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri)
                                    intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                } else {
                                    cameraUri = null
                                }
                            }

                            val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
                                addCategory(Intent.CATEGORY_OPENABLE)
                                type = "image/*"
                                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false)
                            }

                            val initialIntents = cameraUri?.let { arrayOf(cameraIntent) } ?: emptyArray()
                            val chooser = Intent(Intent.ACTION_CHOOSER).apply {
                                putExtra(Intent.EXTRA_INTENT, contentIntent)
                                putExtra(Intent.EXTRA_TITLE, "选择图片或拍照")
                                putExtra(Intent.EXTRA_INITIAL_INTENTS, initialIntents)
                                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            }

                            filePickerLauncher.launch(chooser)
                            return true
                        }
                    }
                    loadUrl("file:///android_asset/index.html")
                }
            }
        )
    }
}
