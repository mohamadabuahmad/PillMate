// #include <M5Stack.h>
// #include <WiFi.h>
// #include <WebServer.h>
// #include <FirebaseESP32.h>
// #include <Preferences.h>
// #include <ArduinoJson.h>

// // ============================================
// // CONFIGURATION
// // ============================================
// // Firebase Realtime Database Configuration
// #define FIREBASE_HOST
// "pillmate-cc6cd-default-rtdb.asia-southeast1.firebasedatabase.app"
// // IMPORTANT: Get your database secret from Firebase Console
// // Go to: Project Settings → Service Accounts → Database Secrets
// // Or: Realtime Database → Data → (three dots) → Show Secret
// #define FIREBASE_AUTH "YOUR_DATABASE_SECRET_HERE"  // ⚠️ REPLACE THIS!

// // AP Mode Configuration (Device's own WiFi)
// #define AP_SSID_PREFIX "PillMate-"
// #define AP_PASSWORD "12345678"

// // ============================================
// // GLOBAL VARIABLES
// // ============================================
// WebServer server(80);
// Preferences preferences;
// FirebaseData firebaseData;
// FirebaseAuth firebaseAuth;
// FirebaseConfig firebaseConfig;

// String devicePIN;
// String savedSSID = "";
// String savedPassword = "";
// bool isLinked = false;
// bool wifiConfigured = false;
// unsigned long lastCheckTime = 0;
// const unsigned long CHECK_INTERVAL = 2000; // Check every 2 seconds
// int wifiScanCount = 0;
// String wifiNetworks = "";

// // ============================================
// // SETUP FUNCTION
// // ============================================
// void setup() {
//   M5.begin();
//   M5.Lcd.setBrightness(100);
//   M5.Lcd.fillScreen(BLACK);
//   M5.Lcd.setTextColor(WHITE);
//   M5.Lcd.setTextSize(2);

//   Serial.begin(115200);
//   delay(1000);
//   Serial.println("\n\n=== PillMate Box Starting ===");
//   Serial.println("Version: 1.0");

//   // Check if FIREBASE_AUTH is set
//   if (strlen(FIREBASE_AUTH) == 0 || strcmp(FIREBASE_AUTH,
//   "YOUR_DATABASE_SECRET_HERE") == 0) {
//     Serial.println("❌ ERROR: FIREBASE_AUTH not configured!");
//     Serial.println("Please set your database secret in the code.");
//     M5.Lcd.fillScreen(RED);
//     M5.Lcd.setCursor(10, 10);
//     M5.Lcd.setTextColor(WHITE);
//     M5.Lcd.setTextSize(2);
//     M5.Lcd.println("ERROR!");
//     M5.Lcd.setTextSize(1);
//     M5.Lcd.setCursor(10, 40);
//     M5.Lcd.println("Firebase secret");
//     M5.Lcd.setCursor(10, 60);
//     M5.Lcd.println("not configured!");
//     M5.Lcd.setCursor(10, 100);
//     M5.Lcd.println("Check code");
//     while(1) delay(1000); // Halt
//   }

//   M5.Lcd.setCursor(10, 10);
//   M5.Lcd.println("PillMate Box");
//   M5.Lcd.setCursor(10, 40);
//   M5.Lcd.println("Initializing...");

//   preferences.begin("wifi", false);

//   savedSSID = preferences.getString("ssid", "");
//   savedPassword = preferences.getString("password", "");

//   if (savedSSID.length() > 0) {
//     Serial.println("Found saved WiFi credentials");
//     Serial.print("SSID: ");
//     Serial.println(savedSSID);
//     wifiConfigured = true;
//     connectToSavedWiFi();
//   } else {
//     Serial.println("No saved WiFi credentials, starting AP mode");
//     startAPMode();
//   }

//   delay(1000);
// }

// // ============================================
// // MAIN LOOP
// // ============================================
// void loop() {
//   M5.update();

//   if (!wifiConfigured) {
//     server.handleClient();
//   } else if (WiFi.status() == WL_CONNECTED) {
//     if (millis() - lastCheckTime >= CHECK_INTERVAL) {
//       lastCheckTime = millis();

//       if (!isLinked) {
//         checkLinkStatus();
//       } else {
//         checkDispenseCommand();
//         updateLastSeen();
//       }
//     }
//   } else {
//     // WiFi disconnected, try to reconnect
//     Serial.println("WiFi disconnected, attempting reconnect...");
//     connectToSavedWiFi();
//   }

//   delay(100);
// }

// // ============================================
// // START AP MODE (Device creates WiFi network)
// // ============================================
// void startAPMode() {
//   uint8_t mac[6];
//   WiFi.macAddress(mac);
//   String macStr = String(mac[3], HEX) + String(mac[4], HEX) + String(mac[5],
//   HEX); macStr.toUpperCase(); String apSSID = AP_SSID_PREFIX +
//   macStr.substring(0, 4);

//   WiFi.mode(WIFI_AP);
//   WiFi.softAP(apSSID.c_str(), AP_PASSWORD);

//   IPAddress IP = WiFi.softAPIP();
//   Serial.print("AP IP address: ");
//   Serial.println(IP);
//   Serial.print("AP SSID: ");
//   Serial.println(apSSID);

//   M5.Lcd.fillScreen(BLACK);
//   M5.Lcd.setTextColor(WHITE);
//   M5.Lcd.setTextSize(2);
//   M5.Lcd.setCursor(10, 10);
//   M5.Lcd.println("WiFi Setup Mode");
//   M5.Lcd.setTextSize(1);
//   M5.Lcd.setCursor(10, 40);
//   M5.Lcd.print("Connect to:");
//   M5.Lcd.setTextSize(2);
//   M5.Lcd.setCursor(10, 60);
//   M5.Lcd.setTextColor(GREEN);
//   M5.Lcd.println(apSSID);
//   M5.Lcd.setTextSize(1);
//   M5.Lcd.setTextColor(WHITE);
//   M5.Lcd.setCursor(10, 90);
//   M5.Lcd.print("Password: ");
//   M5.Lcd.println(AP_PASSWORD);
//   M5.Lcd.setCursor(10, 110);
//   M5.Lcd.print("Then open:");
//   M5.Lcd.setCursor(10, 130);
//   M5.Lcd.setTextColor(YELLOW);
//   M5.Lcd.print("http://");
//   M5.Lcd.println(IP);

//   // Scan for WiFi networks
//   scanWiFiNetworks();

//   // Setup web server routes
//   server.on("/", handleRoot);
//   server.on("/scan", handleScan);
//   server.on("/save", handleSave);
//   server.on("/status", handleStatus);
//   server.begin();

//   Serial.println("Web server started");
// }

// // ============================================
// // SCAN FOR WIFI NETWORKS
// // ============================================
// void scanWiFiNetworks() {
//   Serial.println("Scanning for WiFi networks...");
//   M5.Lcd.setCursor(10, 150);
//   M5.Lcd.setTextSize(1);
//   M5.Lcd.setTextColor(YELLOW);
//   M5.Lcd.println("Scanning WiFi...");

//   WiFi.mode(WIFI_AP_STA);
//   wifiScanCount = WiFi.scanNetworks();

//   Serial.print("Found ");
//   Serial.print(wifiScanCount);
//   Serial.println(" networks");

//   wifiNetworks = "[";
//   for (int i = 0; i < wifiScanCount; i++) {
//     if (i > 0) wifiNetworks += ",";
//     wifiNetworks += "{";
//     wifiNetworks += "\"ssid\":\"" + WiFi.SSID(i) + "\",";
//     wifiNetworks += "\"rssi\":" + String(WiFi.RSSI(i)) + ",";
//     wifiNetworks += "\"encryption\":" + String(WiFi.encryptionType(i));
//     wifiNetworks += "}";
//   }
//   wifiNetworks += "]";

//   WiFi.mode(WIFI_AP);

//   M5.Lcd.fillRect(0, 150, 320, 20, BLACK);
// }

// // ============================================
// // WEB SERVER HANDLERS
// // ============================================
// void handleRoot() {
//   String html = "<!DOCTYPE html><html><head>";
//   html += "<meta name='viewport' content='width=device-width,
//   initial-scale=1'>"; html += "<title>PillMate WiFi Setup</title>"; html +=
//   "<style>"; html += "body { font-family: Arial; margin: 0; padding: 20px;
//   background: #f0f0f0; }"; html += ".container { background: white; padding:
//   20px; border-radius: 10px; max-width: 400px; margin: 0 auto; box-shadow: 0
//   2px 10px rgba(0,0,0,0.1); }"; html += "h1 { color: #333; margin-top: 0; }";
//   html += ".form-group { margin: 15px 0; }";
//   html += "label { display: block; margin-bottom: 5px; font-weight: bold;
//   color: #555; }"; html += "select, input { width: 100%; padding: 12px;
//   margin: 5px 0; border: 2px solid #ddd; border-radius: 5px; box-sizing:
//   border-box; font-size: 16px; }"; html += "select:focus, input:focus {
//   outline: none; border-color: #007AFF; }"; html += "button { width: 100%;
//   padding: 14px; background: #007AFF; color: white; border: none;
//   border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer;
//   margin-top: 10px; }"; html += "button:hover { background: #0056b3; }"; html
//   += "button:disabled { background: #ccc; cursor: not-allowed; }"; html +=
//   ".refresh-btn { background: #28a745; margin-top: 5px; }"; html +=
//   ".refresh-btn:hover { background: #218838; }"; html += ".status {
//   margin-top: 20px; padding: 12px; border-radius: 5px; }"; html += ".success
//   { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }"; html
//   += ".error { background: #f8d7da; color: #721c24; border: 1px solid
//   #f5c6cb; }"; html += ".info { background: #d1ecf1; color: #0c5460; border:
//   1px solid #bee5eb; }"; html += ".signal { display: inline-block;
//   margin-left: 10px; font-size: 12px; }"; html += ".signal.strong { color:
//   #28a745; }"; html += ".signal.medium { color: #ffc107; }"; html +=
//   ".signal.weak { color: #dc3545; }"; html += "</style></head><body>"; html
//   += "<div class='container'>"; html += "<h1>🔌 PillMate WiFi Setup</h1>";
//   html += "<form id='wifiForm'>";
//   html += "<div class='form-group'>";
//   html += "<label>Select WiFi Network:</label>";
//   html += "<select id='ssidSelect' name='ssid' required>";
//   html += "<option value=''>-- Select Network --</option>";
//   html += "</select>";
//   html += "<button type='button' class='refresh-btn'
//   onclick='scanNetworks()'>🔄 Refresh List</button>"; html += "</div>"; html
//   += "<div class='form-group'>"; html += "<label>WiFi Password:</label>";
//   html += "<input type='password' id='password' name='password'
//   placeholder='Enter password (if required)'>"; html += "</div>"; html +=
//   "<button type='submit' id='connectBtn'>Connect</button>"; html +=
//   "</form>"; html += "<div id='status'></div>"; html += "</div>"; html +=
//   "<script>"; html += "let networks = [];"; html += "function
//   getSignalStrength(rssi) {"; html += "  if(rssi > -50) return '<span
//   class=\"signal strong\">● Strong</span>';"; html += "  if(rssi > -70)
//   return '<span class=\"signal medium\">● Medium</span>';"; html += "  return
//   '<span class=\"signal weak\">● Weak</span>';"; html += "}"; html +=
//   "function populateNetworks() {"; html += "  const select =
//   document.getElementById('ssidSelect');"; html += "  select.innerHTML =
//   '<option value=\"\">-- Select Network --</option>';"; html += "
//   networks.forEach(net => {"; html += "    const option =
//   document.createElement('option');"; html += "    option.value = net.ssid;";
//   html += "    option.text = net.ssid + ' ' + getSignalStrength(net.rssi);";
//   html += "    select.appendChild(option);";
//   html += "  });";
//   html += "}";
//   html += "function scanNetworks() {";
//   html += "  const status = document.getElementById('status');";
//   html += "  status.className = 'status info';";
//   html += "  status.innerHTML = '🔄 Scanning for networks...';";
//   html += "  document.getElementById('connectBtn').disabled = true;";
//   html += "  fetch('/scan')";
//   html += "    .then(r => r.json())";
//   html += "    .then(data => {";
//   html += "      networks = data.networks || [];";
//   html += "      populateNetworks();";
//   html += "      status.className = 'status success';";
//   html += "      status.innerHTML = '✅ Found ' + networks.length + '
//   networks';"; html += "      document.getElementById('connectBtn').disabled
//   = false;"; html += "    })"; html += "    .catch(err => {"; html += "
//   status.className = 'status error';"; html += "      status.innerHTML = '❌
//   Error scanning: ' + err;"; html += "
//   document.getElementById('connectBtn').disabled = false;"; html += " });";
//   html += "}";
//   html += "document.getElementById('wifiForm').addEventListener('submit',
//   function(e) {"; html += "  e.preventDefault();"; html += "  const status =
//   document.getElementById('status');"; html += "  const btn =
//   document.getElementById('connectBtn');"; html += "  const ssid =
//   document.getElementById('ssidSelect').value;"; html += "  const password =
//   document.getElementById('password').value;"; html += "  if(!ssid) {"; html
//   += "    status.className = 'status error';"; html += "    status.innerHTML
//   = '❌ Please select a network';"; html += "    return;"; html += "  }";
//   html += "  status.className = 'status info';";
//   html += "  status.innerHTML = '🔄 Connecting to ' + ssid + '...';";
//   html += "  btn.disabled = true;";
//   html += "  const formData = new FormData();";
//   html += "  formData.append('ssid', ssid);";
//   html += "  formData.append('password', password);";
//   html += "  fetch('/save', { method: 'POST', body: formData })";
//   html += "    .then(r => r.json())";
//   html += "    .then(data => {";
//   html += "      if(data.success) {";
//   html += "        status.className = 'status success';";
//   html += "        status.innerHTML = '✅ Connected! Device is connecting to
//   WiFi...<br>You can close this page.';"; html += "      } else {"; html += "
//   status.className = 'status error';"; html += "        status.innerHTML =
//   '❌ Error: ' + data.message;"; html += "        btn.disabled = false;";
//   html += "      }";
//   html += "    })";
//   html += "    .catch(err => {";
//   html += "      status.className = 'status error';";
//   html += "      status.innerHTML = '❌ Connection failed: ' + err;";
//   html += "      btn.disabled = false;";
//   html += "    });";
//   html += "});";
//   html += "scanNetworks();";
//   html += "</script></body></html>";

//   server.send(200, "text/html", html);
// }

// void handleScan() {
//   scanWiFiNetworks();
//   String json = "{\"networks\":";
//   json += wifiNetworks;
//   json += "}";
//   server.send(200, "application/json", json);
// }

// void handleSave() {
//   if (server.hasArg("ssid")) {
//     String ssid = server.arg("ssid");
//     String password = server.arg("password");

//     if (ssid.length() == 0) {
//       String json = "{\"success\":false,\"message\":\"Please select a
//       network\"}"; server.send(400, "application/json", json); return;
//     }

//     preferences.putString("ssid", ssid);
//     preferences.putString("password", password);
//     savedSSID = ssid;
//     savedPassword = password;

//     String json = "{\"success\":true,\"message\":\"WiFi credentials
//     saved\"}"; server.send(200, "application/json", json);

//     delay(500);
//     connectToSavedWiFi();
//   } else {
//     String json = "{\"success\":false,\"message\":\"Missing SSID\"}";
//     server.send(400, "application/json", json);
//   }
// }

// void handleStatus() {
//   String json = "{";
//   json += "\"wifi_connected\":" + String(WiFi.status() == WL_CONNECTED ?
//   "true" : "false") + ","; json += "\"ip\":\"" + WiFi.localIP().toString() +
//   "\""; json += "}"; server.send(200, "application/json", json);
// }

// // ============================================
// // CONNECT TO SAVED WIFI
// // ============================================
// void connectToSavedWiFi() {
//   if (savedSSID.length() == 0) {
//     return;
//   }

//   M5.Lcd.fillScreen(BLACK);
//   M5.Lcd.setCursor(10, 10);
//   M5.Lcd.setTextSize(2);
//   M5.Lcd.println("Connecting to");
//   M5.Lcd.println("WiFi...");
//   M5.Lcd.setTextSize(1);
//   M5.Lcd.setCursor(10, 60);
//   M5.Lcd.print("SSID: ");
//   M5.Lcd.println(savedSSID);

//   WiFi.mode(WIFI_STA);
//   WiFi.begin(savedSSID.c_str(), savedPassword.c_str());

//   Serial.print("Connecting to WiFi: ");
//   Serial.println(savedSSID);

//   int attempts = 0;
//   while (WiFi.status() != WL_CONNECTED && attempts < 30) {
//     delay(500);
//     Serial.print(".");
//     attempts++;
//   }

//   if (WiFi.status() == WL_CONNECTED) {
//     Serial.println("\nWiFi connected!");
//     Serial.print("IP address: ");
//     Serial.println(WiFi.localIP());

//     wifiConfigured = true;
//     server.stop();

//     M5.Lcd.fillScreen(BLACK);
//     M5.Lcd.setCursor(10, 10);
//     M5.Lcd.setTextSize(2);
//     M5.Lcd.setTextColor(GREEN);
//     M5.Lcd.println("WiFi Connected!");
//     M5.Lcd.setTextColor(WHITE);
//     M5.Lcd.setTextSize(1);
//     M5.Lcd.setCursor(10, 40);
//     M5.Lcd.print("IP: ");
//     M5.Lcd.println(WiFi.localIP());

//     delay(2000);

//     // Initialize Firebase
//     initializeFirebase();

//     // Generate and register device
//     generateDevicePIN();
//     registerDevice();
//     displayPIN();

//   } else {
//     Serial.println("\nWiFi connection failed!");
//     M5.Lcd.fillScreen(RED);
//     M5.Lcd.setCursor(10, 10);
//     M5.Lcd.setTextSize(2);
//     M5.Lcd.setTextColor(WHITE);
//     M5.Lcd.println("WiFi Failed!");
//     M5.Lcd.setTextSize(1);
//     M5.Lcd.println("Wrong password?");
//     M5.Lcd.println("Restarting...");

//     delay(3000);

//     preferences.remove("ssid");
//     preferences.remove("password");
//     savedSSID = "";
//     savedPassword = "";
//     wifiConfigured = false;
//     startAPMode();
//   }
// }

// // ============================================
// // FIREBASE INITIALIZATION
// // ============================================
// void initializeFirebase() {
//   Serial.println("Initializing Firebase...");
//   Serial.print("Host: ");
//   Serial.println(FIREBASE_HOST);
//   Serial.print("Auth configured: ");
//   Serial.println(strlen(FIREBASE_AUTH) > 0 ? "Yes" : "No");

//   firebaseConfig.host = FIREBASE_HOST;
//   firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;

//   // Set timeout
//   firebaseConfig.timeout.serverResponse = 10 * 1000;

//   Firebase.begin(&firebaseConfig, &firebaseAuth);
//   Firebase.reconnectWiFi(true);

//   // Wait for connection
//   Serial.println("Waiting for Firebase connection...");
//   int attempts = 0;
//   while (!Firebase.ready() && attempts < 10) {
//     delay(500);
//     Serial.print(".");
//     attempts++;
//   }

//   if (Firebase.ready()) {
//     Serial.println("\n✅ Firebase initialized successfully!");
//   } else {
//     Serial.println("\n❌ Firebase initialization failed!");
//     Serial.print("Error code: ");
//     Serial.println(firebaseData.errorCode());
//     Serial.print("Error reason: ");
//     Serial.println(firebaseData.errorReason());
//   }
// }

// // ============================================
// // DEVICE PIN GENERATION
// // ============================================
// void generateDevicePIN() {
//   randomSeed(analogRead(0) + millis());
//   int pin = random(100000, 999999);
//   devicePIN = String(pin);

//   Serial.print("Generated PIN: ");
//   Serial.println(devicePIN);
// }

// // ============================================
// // DEVICE REGISTRATION (Write to Firebase)
// // ============================================
// void registerDevice() {
//   String path = "/devices/" + devicePIN;

//   Serial.println("Registering device in Firebase...");
//   Serial.print("Path: ");
//   Serial.println(path);

//   if (!Firebase.ready()) {
//     Serial.println("❌ Firebase not ready! Cannot register device.");
//     M5.Lcd.fillScreen(RED);
//     M5.Lcd.setCursor(10, 10);
//     M5.Lcd.setTextColor(WHITE);
//     M5.Lcd.setTextSize(2);
//     M5.Lcd.println("Firebase Error!");
//     M5.Lcd.setTextSize(1);
//     M5.Lcd.setCursor(10, 40);
//     M5.Lcd.println("Not connected");
//     delay(5000);
//     return;
//   }

//   FirebaseJson json;
//   json.set("status", "WAITING_FOR_PAIR");
//   json.set("pin", devicePIN);
//   json.set("createdAt", millis());
//   json.set("lastSeen", millis());

//   // Convert JSON to string for debugging
//   String jsonStr;
//   json.toString(jsonStr, true);
//   Serial.print("JSON to write: ");
//   Serial.println(jsonStr);

//   if (Firebase.setJSON(firebaseData, path, json)) {
//     Serial.println("✅ Device registered in Firebase successfully!");
//     Serial.print("Data path: ");
//     Serial.println(firebaseData.dataPath());
//     Serial.print("Data type: ");
//     Serial.println(firebaseData.dataType());
//   } else {
//     Serial.println("❌ Failed to register device in Firebase!");
//     Serial.print("Error code: ");
//     Serial.println(firebaseData.errorCode());
//     Serial.print("Error reason: ");
//     Serial.println(firebaseData.errorReason());

//     M5.Lcd.fillScreen(RED);
//     M5.Lcd.setCursor(10, 10);
//     M5.Lcd.setTextColor(WHITE);
//     M5.Lcd.setTextSize(2);
//     M5.Lcd.println("Firebase Error!");
//     M5.Lcd.setTextSize(1);
//     M5.Lcd.setCursor(10, 40);
//     M5.Lcd.println("Code: " + String(firebaseData.errorCode()));
//     M5.Lcd.setCursor(10, 60);
//     String errorMsg = firebaseData.errorReason();
//     if (errorMsg.length() > 30) {
//       errorMsg = errorMsg.substring(0, 30) + "...";
//     }
//     M5.Lcd.println(errorMsg);
//     M5.Lcd.setCursor(10, 100);
//     M5.Lcd.println("Check Serial Monitor");

//     delay(10000);
//   }
// }

// // ============================================
// // DISPLAY PIN ON SCREEN
// // ============================================
// void displayPIN() {
//   M5.Lcd.fillScreen(BLACK);
//   M5.Lcd.setTextColor(WHITE);
//   M5.Lcd.setTextSize(3);

//   M5.Lcd.setCursor(50, 30);
//   M5.Lcd.println("Pairing Mode");

//   M5.Lcd.setCursor(50, 80);
//   M5.Lcd.setTextSize(1);
//   M5.Lcd.println("Enter this PIN in app:");

//   M5.Lcd.setCursor(50, 120);
//   M5.Lcd.setTextSize(4);
//   M5.Lcd.setTextColor(GREEN);
//   M5.Lcd.println(devicePIN);

//   M5.Lcd.setCursor(50, 180);
//   M5.Lcd.setTextSize(1);
//   M5.Lcd.setTextColor(WHITE);
//   M5.Lcd.println("Waiting for link...");
// }

// // ============================================
// // CHECK LINK STATUS (Read from Firebase)
// // ============================================
// void checkLinkStatus() {
//   String path = "/devices/" + devicePIN + "/status";

//   if (Firebase.getString(firebaseData, path)) {
//     String status = firebaseData.stringData();
//     status.trim();
//     status.replace("\"", "");

//     if (status == "LINKED") {
//       isLinked = true;
//       Serial.println("✅ Device linked successfully!");

//       M5.Lcd.fillScreen(GREEN);
//       M5.Lcd.setCursor(50, 80);
//       M5.Lcd.setTextSize(3);
//       M5.Lcd.setTextColor(WHITE);
//       M5.Lcd.println("LINKED!");
//       M5.Lcd.setCursor(50, 130);
//       M5.Lcd.setTextSize(2);
//       M5.Lcd.println("Ready to use");

//       delay(3000);
//       M5.Lcd.fillScreen(BLACK);
//       M5.Lcd.setCursor(50, 100);
//       M5.Lcd.setTextSize(2);
//       M5.Lcd.setTextColor(GREEN);
//       M5.Lcd.println("Device Ready");
//     }
//   } else {
//     String errorReason = firebaseData.errorReason();
//     if (errorReason != "path not exist" && errorReason.length() > 0) {
//       Serial.print("Error checking status: ");
//       Serial.println(errorReason);
//     }
//   }
// }

// // ============================================
// // CHECK DISPENSE COMMAND (Read from Firebase)
// // ============================================
// void checkDispenseCommand() {
//   String path = "/devices/" + devicePIN + "/dispense";

//   if (Firebase.getBool(firebaseData, path)) {
//     bool shouldDispense = firebaseData.boolData();

//     if (shouldDispense) {
//       Serial.println("✅ Dispense command received!");
//       performDispense();

//       // Reset dispense flag
//       Firebase.setBool(firebaseData, path, false);

//       // Update last action
//       String actionPath = "/devices/" + devicePIN + "/lastAction";
//       String actionMsg = "Dose dispensed at " + String(millis());
//       Firebase.setString(firebaseData, actionPath, actionMsg);
//     }
//   }
// }

// // ============================================
// // UPDATE LAST SEEN
// // ============================================
// void updateLastSeen() {
//   String path = "/devices/" + devicePIN + "/lastSeen";
//   Firebase.setInt(firebaseData, path, millis());
// }

// // ============================================
// // PERFORM DISPENSE
// // ============================================
// void performDispense() {
//   Serial.println("Performing dispense...");

//   M5.Lcd.fillScreen(BLUE);
//   M5.Lcd.setCursor(50, 100);
//   M5.Lcd.setTextSize(3);
//   M5.Lcd.setTextColor(WHITE);
//   M5.Lcd.println("DISPENSING");

//   // TODO: Add your hardware control code here
//   // Example: Activate servo motor, laser, etc.
//   // servo.write(90);  // Rotate servo
//   // delay(1000);
//   // servo.write(0);   // Return to position

//   delay(2000);
//   M5.Lcd.fillScreen(BLACK);
//   M5.Lcd.setCursor(50, 100);
//   M5.Lcd.setTextSize(2);
//   M5.Lcd.setTextColor(GREEN);
//   M5.Lcd.println("Dose Dispensed");

//   delay(1000);
//   M5.Lcd.fillScreen(BLACK);
//   M5.Lcd.setCursor(50, 100);
//   M5.Lcd.setTextSize(2);
//   M5.Lcd.setTextColor(GREEN);
//   M5.Lcd.println("Device Ready");

//   Serial.println("✅ Dose dispensed successfully");
// }
