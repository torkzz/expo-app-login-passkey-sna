package expo.modules.cellularrequest

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean

class CellularRequestModule : Module() {
    private val scope = CoroutineScope(Dispatchers.IO)

    override fun definition() = ModuleDefinition {
        Name("CellularRequest")

        AsyncFunction("triggerCellularGet") { urlString: String, promise: Promise ->
            scope.launch {
                val context = appContext.reactContext?.applicationContext
                if (context == null) {
                    promise.reject("ERR_CONTEXT", "Application context is null", null)
                    return@launch
                }

                val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                if (connectivityManager == null) {
                    promise.reject("ERR_CONNECTIVITY", "ConnectivityManager is null", null)
                    return@launch
                }

                val networkRequest = NetworkRequest.Builder()
                    .addTransportType(NetworkCapabilities.TRANSPORT_CELLULAR)
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build()

                val isResolved = AtomicBoolean(false)

                val networkCallback = object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        super.onAvailable(network)
                        if (isResolved.get()) return
                        
                        try {
                            val url = URL(urlString)
                            val connection = network.openConnection(url) as HttpURLConnection
                            connection.requestMethod = "GET"
                            connection.connectTimeout = 15000
                            connection.readTimeout = 15000
                            connection.instanceFollowRedirects = true
                            
                            connection.connect()
                            val responseCode = connection.responseCode
                            
                            val inputStream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
                            val responseBody = inputStream?.bufferedReader()?.use { it.readText() } ?: ""
                            
                            // We successfully executed the request over the cellular network interface
                            if (isResolved.compareAndSet(false, true)) {
                                try {
                                    connectivityManager.unregisterNetworkCallback(this)
                                } catch (e: Exception) {}
                                
                                val resultMap = mapOf(
                                    "status" to responseCode,
                                    "body" to responseBody
                                )
                                promise.resolve(resultMap)
                            }
                        } catch (e: Exception) {
                            if (isResolved.compareAndSet(false, true)) {
                                try {
                                    connectivityManager.unregisterNetworkCallback(this)
                                } catch (ex: Exception) {}
                                promise.reject("ERR_CELLULAR_GET_FAILED", "Failed to execute GET over cellular: ${e.message}", e)
                            }
                        }
                    }
                }

                // Register network request
                try {
                    connectivityManager.requestNetwork(networkRequest, networkCallback)
                    
                    // Set a manual safety timeout of 15 seconds
                    scope.launch {
                        kotlinx.coroutines.delay(15000)
                        if (isResolved.compareAndSet(false, true)) {
                            try {
                                connectivityManager.unregisterNetworkCallback(networkCallback)
                            } catch (e: Exception) {}
                            promise.reject("ERR_TIMEOUT", "Timeout waiting for cellular network", null)
                        }
                    }
                } catch (e: Exception) {
                    promise.reject("ERR_REQUEST_NETWORK", "Failed to request cellular network: ${e.message}", e)
                }
            }
        }
    }
}
