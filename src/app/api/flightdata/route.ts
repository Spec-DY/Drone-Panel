import { NextRequest, NextResponse } from "next/server";
import { UnityData } from "../../../types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// 获取 Cloudflare 环境的函数
function getCloudflareEnv() {
  try {
    const context = getCloudflareContext();
    return context?.env;
  } catch (error) {
    console.error("Failed to get Cloudflare context:", error);
    return null;
  }
}

// 错误处理工具函数
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// D1数据库操作类
class UnityDataWriter {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // 写入单条数据
  async writeData(data: UnityData): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO unity_data (
        device_id, formatted_time, timestamp, latitude, longitude,
        pitch, yaw, roll, speed, velocity_x, velocity_y, velocity_z,
        horizontal_speed, vertical_speed, flight_direction, ground_distance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    await stmt
      .bind(
        data.deviceId,
        data.formattedTime,
        data.timestamp,
        data.latitude,
        data.longitude,
        data.pitch,
        data.yaw,
        data.roll,
        data.speed,
        data.velocity.x,
        data.velocity.y,
        data.velocity.z,
        data.horizontalSpeed,
        data.verticalSpeed,
        data.flightDirection,
        data.groundDistance
      )
      .run();
  }

  // 批量写入数据
  async writeBatchData(dataArray: UnityData[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO unity_data (
        device_id, formatted_time, timestamp, latitude, longitude,
        pitch, yaw, roll, speed, velocity_x, velocity_y, velocity_z,
        horizontal_speed, vertical_speed, flight_direction, ground_distance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 准备批量操作
    const statements = dataArray.map((data) =>
      stmt.bind(
        data.deviceId,
        data.formattedTime,
        data.timestamp,
        data.latitude,
        data.longitude,
        data.pitch,
        data.yaw,
        data.roll,
        data.speed,
        data.velocity.x,
        data.velocity.y,
        data.velocity.z,
        data.horizontalSpeed,
        data.verticalSpeed,
        data.flightDirection,
        data.groundDistance
      )
    );

    // 执行批量操作
    await this.db.batch(statements);
  }

  // 查询最新数据
  async getLatestData(deviceId: string, limit: number = 10): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM unity_data 
      WHERE device_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    const result = await stmt.bind(deviceId, limit).all();
    return result.results;
  }

  // 查询所有设备的最新数据
  async getAllLatestData(limit: number = 10): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM unity_data 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    const result = await stmt.bind(limit).all();
    return result.results;
  }

  // 根据时间范围查询数据
  async getDataByTimeRange(
    deviceId: string,
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM unity_data 
      WHERE device_id = ? AND timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `);

    const result = await stmt.bind(deviceId, startTime, endTime).all();
    return result.results;
  }
}

export async function POST(request: NextRequest, context: { params: any }) {
  try {
    const env = getCloudflareEnv();

    // 检查D1数据库是否可用
    if (!env || !env.DB) {
      console.error("No D1 binding available");
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const data: UnityData = await request.json();

    console.log("Received data:", data.deviceId, "at", data.formattedTime);

    // 数据验证
    if (!data.deviceId || !data.timestamp) {
      return NextResponse.json(
        { error: "Invalid data format: missing deviceId or timestamp" },
        { status: 400 }
      );
    }

    // 直接写入D1数据库
    const writer = new UnityDataWriter(env.DB);
    await writer.writeData(data);

    console.log("Successfully wrote record to D1");

    return NextResponse.json({
      success: true,
      message: "Data saved successfully",
      data: {
        deviceId: data.deviceId,
        timestamp: data.timestamp,
        formattedTime: data.formattedTime,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to save data", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const env = getCloudflareEnv();

    // 检查D1数据库是否可用
    if (!env || !env.DB) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    const writer = new UnityDataWriter(env.DB);

    // 根据参数查询不同类型的数据
    if (deviceId && startTime && endTime) {
      // 按时间范围查询
      const data = await writer.getDataByTimeRange(
        deviceId,
        parseInt(startTime),
        parseInt(endTime)
      );
      return NextResponse.json({
        data,
        deviceId,
        timeRange: { startTime, endTime },
        count: data.length,
      });
    } else if (deviceId) {
      // 按设备ID查询最新数据
      const data = await writer.getLatestData(deviceId, limit);
      return NextResponse.json({
        data,
        deviceId,
        limit,
        count: data.length,
      });
    } else {
      // 查询所有设备的最新数据
      const data = await writer.getAllLatestData(limit);
      return NextResponse.json({
        data,
        limit,
        count: data.length,
      });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to query data", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
