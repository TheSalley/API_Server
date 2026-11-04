import { createId, nowIso } from "../common/utils/id.js";
import {
  PresetCategoryRecord,
  PresetContent,
  PresetRecord,
} from "./preset.types.js";

export function seedPresetCategories(): PresetCategoryRecord[] {
  const now = nowIso();
  return [
    {
      key: "energy",
      name: "新能源",
      description: "光伏、储能、充电桩、电池等新能源场景",
      sort: 10,
      created_at: now,
      updated_at: now,
    },
    {
      key: "home",
      name: "家居行业",
      description: "家具、家电、全屋定制等家居场景",
      sort: 20,
      created_at: now,
      updated_at: now,
    },
    {
      key: "robot",
      name: "智能机器人",
      description: "工业机器人、服务机器人、AGV 等",
      sort: 30,
      created_at: now,
      updated_at: now,
    },
    {
      key: "industry",
      name: "工业",
      description: "装备制造、电气、自动化等工业场景",
      sort: 40,
      created_at: now,
      updated_at: now,
    },
    {
      key: "common",
      name: "通用",
      description: "不区分行业的通用素材，各客户端都能用",
      sort: 50,
      created_at: now,
      updated_at: now,
    },
  ];
}

function preset({
  category,
  name,
  description,
  texts = [],
  images = [],
  sort,
  enabled = true,
}: {
  category: string;
  name: string;
  description: string;
  texts?: PresetContent["texts"];
  images?: PresetContent["images"];
  sort: number;
  enabled?: boolean;
}): PresetRecord {
  const now = nowIso();
  return {
    id: createId("p_"),
    category,
    category_name: null,
    name,
    description,
    content: JSON.stringify({ texts, images }),
    sort,
    enabled,
    remark: null,
    created_at: now,
    updated_at: now,
  };
}

export function seedPresets(): PresetRecord[] {
  return [
    preset({
      category: "energy",
      name: "光伏电站",
      description: "光伏项目业主的首页主视觉与开场文案",
      sort: 10,
      images: [
        { url: "/seed/solar1.svg", name: "光伏电站航拍" },
        { url: "/seed/solar2.svg", name: "逆变器特写" },
      ],
      texts: [
        { title: "品牌主张", content: "阳光入网，收益看得见" },
        { title: "副标题", content: "单站日发电 1200 度起" },
      ],
    }),
    preset({
      category: "energy",
      name: "储能系统",
      description: "工商业储能的卖点图与方案文案",
      sort: 20,
      images: [{ url: "/seed/battery1.svg", name: "储能柜外观" }],
      texts: [
        { title: "卖点一", content: "峰谷价差套利，回本周期 3.2 年" },
        { title: "卖点二", content: "循环寿命 6000 次不衰减" },
      ],
    }),
    preset({
      category: "home",
      name: "全屋定制",
      description: "全屋定制门店的样板间图片与话术",
      sort: 30,
      images: [
        { url: "/seed/kitchen1.svg", name: "厨房样板间" },
        { url: "/seed/wardrobe1.svg", name: "衣帽间" },
      ],
      texts: [
        { title: "主推", content: "28 天交付，甲醛低于国标" },
        { title: "工艺", content: "一门到顶，五金质保 10 年" },
      ],
    }),
    preset({
      category: "home",
      name: "智能家居",
      description: "全屋智能的场景联动演示素材",
      sort: 40,
      enabled: false,
      images: [{ url: "/seed/smarthome1.svg", name: "智能客厅" }],
      texts: [{ title: "场景", content: "离家一键，灯、锁、空调全关" }],
    }),
    preset({
      category: "robot",
      name: "协作机器人",
      description: "六轴协作机械臂的应用案例素材",
      sort: 50,
      images: [{ url: "/seed/cobot1.svg", name: "产线装配" }],
      texts: [
        { title: "参数", content: "负载 12kg，重复精度 ±0.02mm" },
        { title: "价值", content: "换产线 15 分钟，人机共线安全" },
      ],
    }),
    preset({
      category: "robot",
      name: "AGV 搬运",
      description: "仓储物流 AGV 的调度与案例文案",
      sort: 60,
      texts: [
        { title: "效率", content: "单台日搬运 800 托，误差 ±5mm" },
        { title: "调度", content: "20 台同时跑，不堵车不打架" },
      ],
    }),
    preset({
      category: "industry",
      name: "数控机床",
      description: "机床企业的产品宣传与展会素材",
      sort: 70,
      images: [
        { url: "/seed/cnc1.svg", name: "五轴加工中心" },
        { url: "/seed/cnc2.svg", name: "车间实拍" },
      ],
      texts: [
        { title: "精度", content: "定位精度 0.005mm，24 小时连续加工" },
        { title: "售后", content: "全国 72 个服务网点，24 小时响应" },
      ],
    }),
    preset({
      category: "industry",
      name: "工厂数字化",
      description: "MES 与产线大屏的演示素材",
      sort: 80,
      enabled: false,
      texts: [{ title: "效果", content: "订单准交率从 78% 提到 96%" }],
    }),
    preset({
      category: "common",
      name: "通用首页",
      description: "不区分行业的通用首页主视觉",
      sort: 90,
      images: [{ url: "/seed/home1.svg", name: "主视觉背景" }],
      texts: [{ title: "主张", content: "把复杂留给我们，把简单交给你" }],
    }),
  ];
}
