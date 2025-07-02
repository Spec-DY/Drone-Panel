// app/api/telemetry/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 接收Unity发送的数据
export async function POST(request: NextRequest) {
  try {
    // 解析JSON数据
    const data = await request.json();

    // 打印接收到的数据（调试用）
    console.log("收到数据:", data);

    if (data === null) {
      return NextResponse.json({ rejected: "数据不能为空" });
    }

    // 保存到文件
    await saveDataToFile(data);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "数据接收成功",
    });
  } catch (error) {
    console.error("处理数据失败:", error);
    return NextResponse.json(
      {
        error: "数据处理失败",
      },
      { status: 500 }
    );
  }
}

// 保存数据到文件
async function saveDataToFile(data: any) {
  // 创建data目录（如果不存在）
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 按日期创建文件名
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filename = `flightdata_${today}.jsonl`;
  const filepath = path.join(dataDir, filename);

  // 追加数据到文件（每行一个JSON对象）
  const jsonLine = JSON.stringify(data) + "\n";
  fs.appendFileSync(filepath, jsonLine);

  console.log(`数据已保存到: ${filepath}`);
}
