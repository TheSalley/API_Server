/**
 * 组件可编辑字段 Schema（数据源：前端 src/utils/dataExtractor.js 的 EDITABLE_FIELDS_MAP
 * 以及各 ElementorFields/*.vue 组件的字段 label）。
 *
 * 用于：后端对预设文案做 label / field_type 自动补全
 *
 * type 取值：
 *   text      - 单行文案
 *   textarea  - 多行文案
 *   rich      - 富文本（HTML）
 *   number    - 数字
 *   media/image - 图片字段（不参与文案预设，仅列出）
 *   repeater  - 列表/重复项字段（不参与文案预设，仅列出）
 *   toggle    - 开关字段（不参与文案预设，仅列出）
 */

export const COPY_FIELDS_BY_WIDGET = {
  // ===== Basic =====
  heading: [
    { key: "title", label: "标题", type: "text", maxlength: 100 },
  ],
  "text-editor": [
    { key: "editor", label: "文案", type: "rich" },
  ],
  button: [
    { key: "text", label: "按钮文案", type: "text", maxlength: 50 },
  ],
  image: [
    { key: "image", label: "图片", type: "image" },
  ],
  video: [
    { key: "youtube_url", label: "视频链接", type: "text" },
  ],
  divider: [
    { key: "text", label: "分割线内容", type: "text", maxlength: 50 },
    { key: "look", label: "分割线样式", type: "toggle" },
  ],

  // ===== General =====
  "icon-box": [
    { key: "title_text", label: "标题", type: "text", maxlength: 100 },
    { key: "description_text", label: "描述", type: "textarea", maxlength: 500 },
  ],
  "icon-list": [
    { key: "icon_list", label: "图标列表", type: "repeater" },
  ],
  counter: [
    { key: "title", label: "标题", type: "text", maxlength: 100 },
    { key: "ending_number", label: "结束数字", type: "number" },
    { key: "suffix", label: "后缀", type: "text", maxlength: 10 },
  ],
  "image-box": [
    { key: "image", label: "图片", type: "image" },
    { key: "title_text", label: "标题", type: "text", maxlength: 100 },
    { key: "description_text", label: "描述", type: "textarea", maxlength: 500 },
  ],
  "image-carousel": [
    { key: "carousel", label: "轮播图", type: "repeater" },
  ],
  accordion: [
    { key: "tabs", label: "手风琴项", type: "repeater" },
  ],
  toggle: [
    { key: "tabs", label: "折叠项", type: "repeater" },
  ],
  testimonial: [
    { key: "testimonial_image", label: "头像", type: "image" },
    { key: "testimonial_name", label: "姓名", type: "text", maxlength: 50 },
    { key: "testimonial_job", label: "职位", type: "text", maxlength: 100 },
    { key: "testimonial_content", label: "评价内容", type: "textarea", maxlength: 1000 },
  ],
  tabs: [
    { key: "tabs", label: "标签页", type: "repeater" },
  ],
  "image-gallery": [
    { key: "wp_gallery", label: "画廊图片", type: "repeater" },
  ],
  progress: [
    { key: "title", label: "标题", type: "text", maxlength: 100 },
    { key: "inner_text", label: "内部文字", type: "text", maxlength: 50 },
    { key: "display_percentage", label: "显示百分比", type: "toggle" },
    { key: "percent", label: "百分比", type: "number" },
  ],

  // ===== Pro =====
  slides: [
    { key: "slides", label: "幻灯片", type: "repeater" },
  ],
  gallery: [
    { key: "gallery", label: "画廊", type: "repeater" },
  ],
  "animated-headline": [
    { key: "before_text", label: "前置文字", type: "text", maxlength: 100 },
    { key: "highlighted_text", label: "高亮文字", type: "text", maxlength: 100 },
  ],
  hotspot: [
    { key: "image", label: "图片", type: "image" },
    { key: "hotspot", label: "热区", type: "repeater" },
  ],
  "flip-box": [
    { key: "title_text_a", label: "正面标题", type: "text", maxlength: 100 },
    { key: "description_text_a", label: "正面描述", type: "textarea", maxlength: 500 },
    { key: "title_text_b", label: "背面标题", type: "text", maxlength: 100 },
    { key: "description_text_b", label: "背面描述", type: "textarea", maxlength: 500 },
    { key: "button_text", label: "按钮文案", type: "text", maxlength: 50 },
  ],
  "call-to-action": [
    { key: "bg_image", label: "背景图", type: "image" },
    { key: "title", label: "标题", type: "text", maxlength: 100 },
    { key: "description", label: "描述", type: "textarea", maxlength: 2000 },
    { key: "button", label: "按钮文案", type: "text", maxlength: 50 },
  ],
  "testimonial-carousel": [
    { key: "slides", label: "评价轮播", type: "repeater" },
  ],
  reviews: [
    { key: "slides", label: "评价轮播", type: "repeater" },
  ],

  // ===== JegElementorKit =====
  jkit_heading: [
    { key: "sg_title_before", label: "前置标题", type: "text", maxlength: 100 },
    { key: "sg_title_focused", label: "高亮标题", type: "text", maxlength: 100 },
    { key: "sg_title_after", label: "后置标题", type: "text", maxlength: 100 },
    { key: "sg_subtitle_enable", label: "显示副标题", type: "toggle" },
    { key: "sg_subtitle_heading", label: "副标题", type: "text", maxlength: 200 },
    { key: "sg_description_enable", label: "显示描述", type: "toggle" },
    { key: "sg_description", label: "描述", type: "textarea", maxlength: 1000 },
    { key: "sg_shadow_enable", label: "显示阴影文字", type: "toggle" },
    { key: "sg_shadow_content", label: "阴影文字", type: "text", maxlength: 100 },
  ],
  jkit_button: [
    { key: "sg_content_label", label: "按钮文本", type: "text", maxlength: 50 },
  ],
  jkit_video_button: [
    { key: "sg_video_url", label: "视频链接", type: "text" },
  ],
  jkit_icon_box: [
    { key: "sg_icon_text", label: "标题", type: "text", maxlength: 100 },
    { key: "sg_icon_description", label: "描述", type: "textarea", maxlength: 500 },
    { key: "sg_readmore_enable_button", label: "显示了解更多", type: "toggle" },
    { key: "sg_readmore_button_label", label: "了解更多按钮文案", type: "text", maxlength: 50 },
    { key: "sg_badge_show", label: "显示角标", type: "toggle" },
    { key: "sg_badge_text", label: "角标文案", type: "text", maxlength: 30 },
    { key: "sg_icon_type", label: "图标类型", type: "toggle" },
    { key: "sg_icon_image", label: "图标图片", type: "image" },
  ],
  jkit_image_box: [
    { key: "sg_image_choose", label: "图片", type: "image" },
    { key: "sg_body_title", label: "标题", type: "text", maxlength: 100 },
    { key: "sg_body_description", label: "描述", type: "textarea", maxlength: 500 },
    { key: "sg_button_enable", label: "显示按钮", type: "toggle" },
    { key: "sg_button_label", label: "按钮文案", type: "text", maxlength: 50 },
  ],
  jkit_fun_fact: [
    { key: "sg_content_number_prefix", label: "数字前缀", type: "text", maxlength: 10 },
    { key: "sg_content_number", label: "数字", type: "number" },
    { key: "sg_content_number_suffix", label: "数字后缀", type: "text", maxlength: 10 },
    { key: "sg_content_title", label: "标题", type: "text", maxlength: 100 },
    { key: "sg_icon_type", label: "图标类型", type: "toggle" },
    { key: "sg_icon_image", label: "图标图片", type: "image" },
  ],
  jkit_progress_bar: [
    { key: "sg_progress_title", label: "标题", type: "text", maxlength: 100 },
    { key: "sg_progress_percentage", label: "百分比", type: "number" },
  ],
  jkit_client_logo: [
    { key: "sg_logo_list", label: "Logo 列表", type: "repeater" },
  ],
  jkit_testimonials: [
    { key: "sg_testimonials_list", label: "评价列表", type: "repeater" },
  ],
  jkit_accordion: [
    { key: "sg_accordion_list", label: "手风琴列表", type: "repeater" },
  ],
  jkit_gallery: [
    { key: "sg_filter_list", label: "筛选列表", type: "repeater" },
    { key: "sg_gallery_list", label: "画廊列表", type: "repeater" },
  ],
  jkit_team: [
    { key: "sg_member_image", label: "成员图片", type: "image" },
    { key: "sg_member_name", label: "姓名", type: "text", maxlength: 50 },
    { key: "sg_member_show_description", label: "显示简介", type: "toggle" },
    { key: "sg_member_description", label: "简介", type: "textarea", maxlength: 500 },
  ],
  jkit_portfolio_gallery: [
    { key: "sg_gallery_list", label: "作品列表", type: "repeater" },
  ],
  jkit_feature_list: [
    { key: "sg_setting_list", label: "功能列表", type: "repeater" },
  ],

  // ===== ElementsKit =====
  "elementskit-image-accordion": [
    { key: "ekit_img_accordion_items", label: "图片手风琴项", type: "repeater" },
  ],
  "elementskit-accordion": [
    { key: "ekit_accordion_items", label: "手风琴项", type: "repeater" },
  ],
  "elementskit-button": [
    { key: "ekit_btn_text", label: "按钮文本", type: "text", maxlength: 50 },
  ],
  "elementskit-heading": [
    { key: "ekit_heading_title", label: "标题", type: "text", maxlength: 100 },
    { key: "ekit_heading_sub_title_show", label: "显示副标题", type: "toggle" },
    { key: "ekit_heading_sub_title", label: "副标题", type: "text", maxlength: 200 },
    { key: "ekit_heading_section_extra_title_show", label: "显示附加标题", type: "toggle" },
    { key: "ekit_heading_extra_title", label: "附加标题", type: "text", maxlength: 100 },
    { key: "show_shadow_text", label: "显示阴影文字", type: "toggle" },
    { key: "shadow_text_content", label: "阴影文字", type: "text", maxlength: 100 },
  ],
  "elementskit-icon-box": [
    { key: "ekit_icon_box_enable_header_icon", label: "显示头部图标", type: "toggle" },
    { key: "ekit_icon_box_header_image", label: "头部图片", type: "image" },
    { key: "ekit_icon_box_title_text", label: "标题", type: "text", maxlength: 100 },
    { key: "ekit_icon_box_description_text", label: "描述", type: "textarea", maxlength: 500 },
    { key: "ekit_icon_box_enable_btn", label: "显示按钮", type: "toggle" },
    { key: "ekit_icon_box_btn_text", label: "按钮文案", type: "text", maxlength: 50 },
    { key: "ekit_icon_box_badge_control", label: "显示角标", type: "toggle" },
    { key: "ekit_icon_box_badge_title", label: "角标文案", type: "text", maxlength: 30 },
  ],
  "elementskit-image-box": [
    { key: "ekit_image_box_image", label: "图片", type: "image" },
    { key: "ekit_image_box_title_text", label: "标题", type: "text", maxlength: 100 },
    { key: "ekit_image_box_description_text", label: "描述", type: "textarea", maxlength: 500 },
    { key: "ekit_image_box_enable_btn", label: "显示按钮", type: "toggle" },
    { key: "ekit_image_box_btn_text", label: "按钮文案", type: "text", maxlength: 50 },
  ],
  "elementskit-client-logo": [
    { key: "ekit_client_logo_repiter", label: "Logo 列表", type: "repeater" },
  ],
  "elementskit-faq": [
    { key: "ekit_faq_content_items", label: "FAQ 列表", type: "repeater" },
  ],
  "elementskit-funfact": [
    { key: "ekit_funfact_number", label: "数字", type: "number" },
    { key: "ekit_funfact_number_suffix", label: "数字后缀", type: "text", maxlength: 10 },
    { key: "ekit_funfact_title_text", label: "标题", type: "text", maxlength: 100 },
  ],
  "elementskit-testimonial": [
    { key: "ekit_testimonial_data", label: "评价数据", type: "repeater" },
  ],
  "elementskit-team": [
    { key: "ekit_team_image", label: "成员图片", type: "image" },
    { key: "ekit_team_name", label: "姓名", type: "text", maxlength: 50 },
    { key: "ekit_team_position", label: "职位", type: "text", maxlength: 100 },
    { key: "ekit_team_show_short_description", label: "显示简介", type: "toggle" },
    { key: "ekit_team_short_description", label: "简介", type: "textarea", maxlength: 500 },
  ],
  "elementskit-progressbar": [
    { key: "ekit_progressbar_title", label: "标题", type: "text", maxlength: 100 },
    { key: "ekit_progressbar_percentage", label: "百分比", type: "number" },
    { key: "ekit_progressbar_percentage_show", label: "显示百分比", type: "toggle" },
  ],

  // ===== Essential Addons =====
  "eael-feature-list": [
    { key: "eael_feature_list", label: "功能列表", type: "repeater" },
  ],

  // ===== Premium Addons =====
  "premium-counter": [
    { key: "premium_counter_title", label: "标题", type: "text", maxlength: 100 },
    { key: "premium_counter_desc", label: "描述", type: "textarea", maxlength: 500 },
    { key: "premium_counter_end_value", label: "结束数字", type: "number" },
    { key: "premium_counter_suffix", label: "后缀", type: "text", maxlength: 10 },
  ],

  // ===== Other =====
  "timeline-widget-addon": [
    { key: "twae_list", label: "时间线列表", type: "repeater" },
  ],
};

/**
 * 参与「预设」的字段（含图片字段，预设内容为图片 URL）
 * 用于 /api/presets/apply 填充缺失字段
 */
export function presetableFieldsOf(widgetType) {
  const fields = COPY_FIELDS_BY_WIDGET[widgetType] || [];
  return fields.filter((f) =>
    ["text", "textarea", "rich", "number", "image"].includes(f.type)
  );
}

export function fieldMetaOf(widgetType, fieldKey) {
  const fields = COPY_FIELDS_BY_WIDGET[widgetType] || [];
  return fields.find((f) => f.key === fieldKey) || null;
}
