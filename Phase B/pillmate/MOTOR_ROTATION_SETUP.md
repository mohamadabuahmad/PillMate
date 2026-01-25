# Motor Rotation Setup for M5Stack Device

## Overview
When a pill notification is sent to the user, the app automatically sends a command to rotate the motor 45 degrees in the M5Stack device.

## Firebase Structure
The motor rotation command is sent to:
```
devices/{devicePIN}/motorRotate
```

With the following structure:
```json
{
  "angle": 45,
  "timestamp": 1234567890,
  "executed": false
}
```

## Arduino Code to Add

Add this code to your `m5stack_pillmate.ino` file:

### 1. Add Servo Library (if using servo motor)
```cpp
#include <Servo.h>
Servo motorServo; // Adjust pin number as needed
const int SERVO_PIN = 2; // Change to your servo pin
```

### 2. Initialize Servo in setup()
```cpp
void setup() {
  // ... existing setup code ...
  
  // Initialize servo motor
  motorServo.attach(SERVO_PIN);
  motorServo.write(0); // Set initial position
}
```

### 3. Add Function to Check Motor Rotation Command
```cpp
// ============================================
// CHECK MOTOR ROTATION COMMAND
// ============================================
void checkMotorRotationCommand() {
  String path = "/devices/" + devicePIN + "/motorRotate";
  
  if (Firebase.getJSON(firebaseData, path)) {
    FirebaseJson json = firebaseData.jsonObject();
    FirebaseJsonData jsonData;
    
    // Check if command has been executed
    json.get(jsonData, "executed");
    bool executed = jsonData.boolValue;
    
    if (!executed) {
      // Get rotation angle
      json.get(jsonData, "angle");
      int angle = jsonData.intValue;
      
      if (angle > 0) {
        Serial.print("🔄 Rotating motor ");
        Serial.print(angle);
        Serial.println(" degrees");
        
        // Rotate motor 45 degrees
        rotateMotor(angle);
        
        // Mark command as executed
        json.set("executed", true);
        Firebase.setJSON(firebaseData, path, json);
      }
    }
  }
}
```

### 4. Add Motor Rotation Function
```cpp
// ============================================
// ROTATE MOTOR
// ============================================
void rotateMotor(int angle) {
  // Get current position (assuming 0 is starting position)
  int currentPosition = motorServo.read();
  
  // Calculate target position (rotate 45 degrees from current)
  int targetPosition = currentPosition + angle;
  
  // Rotate to target position
  motorServo.write(targetPosition);
  
  // Wait for rotation to complete (adjust delay based on your motor speed)
  delay(500);
  
  Serial.print("✅ Motor rotated to position: ");
  Serial.println(targetPosition);
  
  // Optional: Return to original position after a delay
  // delay(1000);
  // motorServo.write(currentPosition);
}
```

### 5. Call checkMotorRotationCommand() in loop()
```cpp
void loop() {
  // ... existing loop code ...
  
  // Check for motor rotation commands
  checkMotorRotationCommand();
  
  // ... rest of loop code ...
}
```

## Alternative: Stepper Motor

If you're using a stepper motor instead of a servo:

```cpp
#include <Stepper.h>

const int stepsPerRevolution = 200; // Adjust for your motor
Stepper myStepper(stepsPerRevolution, 8, 9, 10, 11); // Adjust pins

void rotateMotor(int angle) {
  // Calculate steps needed for 45 degrees
  // For 200 steps/revolution: 45 degrees = 25 steps
  int steps = (angle * stepsPerRevolution) / 360;
  
  myStepper.step(steps);
  delay(500);
  
  Serial.print("✅ Motor rotated ");
  Serial.print(angle);
  Serial.println(" degrees");
}
```

## Notes
- Adjust pin numbers according to your hardware setup
- Adjust delays based on your motor's speed
- The `executed` flag prevents the motor from rotating multiple times for the same command
- The device will automatically mark the command as executed after rotating
