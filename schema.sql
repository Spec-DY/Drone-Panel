
CREATE TABLE unity_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  formatted_time TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  pitch REAL NOT NULL,
  yaw REAL NOT NULL,
  roll REAL NOT NULL,
  speed REAL NOT NULL,
  velocity_x REAL NOT NULL,
  velocity_y REAL NOT NULL,
  velocity_z REAL NOT NULL,
  horizontal_speed REAL NOT NULL,
  vertical_speed REAL NOT NULL,
  flight_direction REAL NOT NULL,
  ground_distance REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_device_id ON unity_data(device_id);
CREATE INDEX idx_timestamp ON unity_data(timestamp);
CREATE INDEX idx_created_at ON unity_data(created_at);
CREATE INDEX idx_device_timestamp ON unity_data(device_id, timestamp);