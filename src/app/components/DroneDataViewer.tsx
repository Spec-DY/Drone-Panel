"use client";

import React, { useState, useEffect } from "react";

// 定义数据类型
interface DroneData {
  id: number;
  device_id: string;
  formatted_time: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  pitch: number;
  yaw: number;
  roll: number;
  speed: number;
  velocity_x: number;
  velocity_y: number;
  velocity_z: number;
  horizontal_speed: number;
  vertical_speed: number;
  flight_direction: number;
  ground_distance: number;
  created_at: string;
}

interface APIResponse {
  data: DroneData[];
  count: number;
}

const DroneDataViewer: React.FC = () => {
  const [latestDeviceData, setLatestDeviceData] = useState<DroneData[]>([]);
  const [historyData, setHistoryData] = useState<DroneData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // 获取所有数据并处理成每个设备的最新数据
  const fetchLatestData = async (
    showLoadingSpinner: boolean = false
  ): Promise<void> => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const response = await fetch("/api/flightdata?limit=100"); // 获取更多数据用于分组

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: APIResponse = await response.json();

      if (result.data) {
        // 按设备分组，每个设备只保留最新的一条数据
        const deviceMap = new Map<string, DroneData>();

        result.data.forEach((item) => {
          const existing = deviceMap.get(item.device_id);
          if (!existing || item.timestamp > existing.timestamp) {
            deviceMap.set(item.device_id, item);
          }
        });

        const latestData = Array.from(deviceMap.values()).sort(
          (a, b) => b.timestamp - a.timestamp
        ); // 按时间倒序排列

        setLatestDeviceData(latestData);
        setLastUpdated(new Date().toLocaleString());
        setError(null);
      } else {
        setError("没有获取到数据");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取数据失败");
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  // 获取特定设备的历史数据
  const fetchHistoryData = async (deviceId: string): Promise<void> => {
    try {
      setHistoryLoading(true);
      const response = await fetch(
        `/api/flightdata?deviceId=${deviceId}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: APIResponse = await response.json();

      if (result.data) {
        setHistoryData(result.data);
        setSelectedDevice(deviceId);
        setShowHistory(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取历史数据失败");
    } finally {
      setHistoryLoading(false);
    }
  };

  // 组件挂载时获取数据并设置轮询
  useEffect(() => {
    fetchLatestData(true); // 首次加载显示加载动画

    // 设置每秒轮询一次
    const interval = setInterval(() => {
      if (isPolling) {
        fetchLatestData(false); // 轮询时不显示加载动画
      }
    }, 1000);

    // 清理函数：组件卸载时清除定时器
    return () => {
      clearInterval(interval);
    };
  }, [isPolling]);

  // 切换轮询状态
  const togglePolling = () => {
    setIsPolling(!isPolling);
  };

  // 手动刷新数据
  const handleManualRefresh = () => {
    fetchLatestData(true);
  };

  // 格式化数值显示
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  // 渲染设备最新数据
  const renderLatestDataItem = (item: DroneData, index: number) => (
    <div
      key={item.device_id}
      className="bg-white border border-gray-200 rounded-lg p-6 mb-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isPolling ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          ></div>
          <h3 className="text-lg font-semibold text-gray-800">
            设备: {item.device_id.slice(-8)}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
            {item.formatted_time}
          </span>
          <button
            onClick={() => fetchHistoryData(item.device_id)}
            disabled={historyLoading}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            历史数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">位置信息</h4>
          <div className="space-y-1 text-sm text-blue-700">
            <p>纬度: {formatNumber(item.latitude, 6)}</p>
            <p>经度: {formatNumber(item.longitude, 6)}</p>
            <p>高度: {formatNumber(item.ground_distance)} m</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">飞行状态</h4>
          <div className="space-y-1 text-sm text-green-700">
            <p>速度: {formatNumber(item.speed)} m/s</p>
            <p>水平速度: {formatNumber(item.horizontal_speed)} m/s</p>
            <p>垂直速度: {formatNumber(item.vertical_speed)} m/s</p>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">飞行姿态</h4>
          <div className="space-y-1 text-sm text-purple-700">
            <p>俯仰: {formatNumber(item.pitch)}°</p>
            <p>偏航: {formatNumber(item.yaw)}°</p>
            <p>翻滚: {formatNumber(item.roll)}°</p>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-medium text-orange-800 mb-2">速度向量</h4>
          <div className="space-y-1 text-sm text-orange-700">
            <p>X: {formatNumber(item.velocity_x)}</p>
            <p>Y: {formatNumber(item.velocity_y)}</p>
            <p>Z: {formatNumber(item.velocity_z)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染历史数据项
  const renderHistoryItem = (item: DroneData, index: number) => (
    <div
      key={item.id}
      className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">#{index + 1}</span>
        <span className="text-sm text-gray-500 font-mono">
          {item.formatted_time}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">位置: </span>
          <span className="font-mono text-black">
            {formatNumber(item.latitude, 4)}, {formatNumber(item.longitude, 4)}
          </span>
        </div>
        <div>
          <span className="text-gray-600">速度: </span>
          <span className="font-mono text-black">
            {formatNumber(item.speed)} m/s
          </span>
        </div>
        <div>
          <span className="text-gray-600">高度: </span>
          <span className="font-mono text-black">
            {formatNumber(item.ground_distance)} m
          </span>
        </div>
        <div>
          <span className="text-gray-600">偏航: </span>
          <span className="font-mono text-black">
            {formatNumber(item.yaw)}°
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 标题和控制栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b-2 border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
          无人机数据监控
        </h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={togglePolling}
            className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 ${
              isPolling
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isPolling ? (
              <>
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                停止轮询
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"
                  />
                </svg>
                开始轮询
              </>
            )}
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                加载中...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                手动刷新
              </>
            )}
          </button>
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              最后更新: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">在线设备</h3>
          <p className="text-3xl font-bold text-green-600">
            {latestDeviceData.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">轮询状态</h3>
          <p
            className={`text-2xl font-bold ${
              isPolling ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPolling ? "运行中" : "已停止"}
          </p>
        </div>
        {latestDeviceData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">最新数据</h3>
            <p className="text-lg font-semibold text-gray-800 font-mono">
              {latestDeviceData[0].formatted_time}
            </p>
          </div>
        )}
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-700">错误: {error}</p>
          </div>
        </div>
      )}

      {/* 历史数据模态框 */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto m-4 w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                设备历史数据: {selectedDevice.slice(-8)}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">加载历史数据...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  共 {historyData.length} 条历史记录
                </p>
                {historyData.map(renderHistoryItem)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 主数据显示 */}
      {loading && latestDeviceData.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载数据...</p>
        </div>
      ) : latestDeviceData.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">设备实时状态</h2>
            <div className="flex items-center text-sm text-gray-500">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isPolling ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              ></div>
              {latestDeviceData.length} 个设备在线
            </div>
          </div>
          <div className="space-y-4">
            {latestDeviceData.map(renderLatestDataItem)}
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500">暂无设备数据</p>
        </div>
      )}
    </div>
  );
};

export default DroneDataViewer;
