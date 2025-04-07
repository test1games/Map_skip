# 城市距离计算平台

这是一个基于高德地图API的城市距离计算平台，允许用户选择起点和终点城市，然后计算它们之间的直线距离和驾车距离。

## 功能特性

- 城市选择：从预设的城市列表中选择起点和终点
- 直线距离计算：显示两城市之间的直线距离
- 驾车距离计算：显示两城市之间的驾车路线距离
- 驾车时间估算：估算驾车所需时间
- 地图可视化：在地图上显示城市位置和路线

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- 高德地图API

## 使用指南

1. 在页面左侧的选择面板中选择起点城市
2. 选择终点城市
3. 点击"计算距离"按钮
4. 系统会在地图上显示两个城市的位置，并绘制连线
5. 在结果面板中查看直线距离、驾车距离和预计驾车时间

## 本地运行

1. 克隆项目到本地
2. 在 `index.html` 文件中替换高德地图API的Key：
   ```html
   <script type="text/javascript" src="https://webapi.amap.com/maps?v=2.0&key=您的高德地图Key"></script>
   ```
3. 使用HTTP服务器启动项目（如使用 VSCode 的 Live Server 插件）

## 项目结构

```
ad-platform-distance/
├── public/
│   └── skipCities.json       # 城市数据
├── index.html                # 主网页文件
├── styles.css                # 样式文件
├── script.js                 # JavaScript业务逻辑
└── README.md                 # 项目说明文档
```

## 注意事项

- 使用前需要申请高德地图API的开发者Key
- 确保有稳定的网络连接以加载地图资源
- 当前版本只包含有限的城市数据，可以根据需要在 `skipCities.json` 中扩展

## 许可证

MIT
