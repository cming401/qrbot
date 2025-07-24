'use server';

/**
 * @fileOverview A KLSE quarterly report analysis AI agent.
 *
 * - analyzeKLSEReport - A function that handles the KLSE report analysis process.
 * - AnalyzeKLSEReportInput - The input type for the analyzeKLSEReport function.
 * - AnalyzeKLSEReportOutput - The return type for the analyzeKLSEReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeKLSEReportInputSchema = z.object({
  reportDataUri: z
    .string()
    .describe(
      "A KLSE quarterly report PDF, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  geminiModel: z.enum(['gemini-2.5-pro', 'gemini-2.5-flash']).describe('The Gemini model to use for analysis.'),
  apiKey: z.string().describe('Your Google Gemini API key.'),
});
export type AnalyzeKLSEReportInput = z.infer<typeof AnalyzeKLSEReportInputSchema>;

const AnalyzeKLSEReportOutputSchema = z.object({
  blogPostHtml: z.string().describe('The generated blog post in HTML format.'),
});
export type AnalyzeKLSEReportOutput = z.infer<typeof AnalyzeKLSEReportOutputSchema>;

export async function analyzeKLSEReport(input: AnalyzeKLSEReportInput): Promise<AnalyzeKLSEReportOutput> {
  return analyzeKLSEReportFlow(input);
}

const analyzeKLSEReportPrompt = ai.definePrompt({
  name: 'analyzeKLSEReportPrompt',
  input: {schema: AnalyzeKLSEReportInputSchema},
  output: {schema: AnalyzeKLSEReportOutputSchema},
  prompt: `你是一位资深的财经Blogger，任务是根据上传的公司季度报告,直接输出内容

将这份报告转化为适合中文博客HTML写作的形式。

报告结构分析：
这份报告的结构清晰、逻辑分明，主要分为以下几个部分：
- 介绍公司
- 财务表现概览: 宏观层面展现了公司整体的收入、利润增长情况，为读者提供一个整体印象。
- 业务部门表现: 详细分析了各个业务部门的业绩，有助于了解各部门对整体表现的贡献和影响。
- 财务状况: 深入探讨资产负债表、现金流量等财务指标，评估公司的财务健康状况。
- 风险与前景: 分析了市场前景、潜在风险以及公司采取的策略。
- 股息: 宣布股息派发，体现了公司对股东的回馈。
- 总结: 简要总结了报告的要点，并展望未来发展。
Blogging Format Prompts (博客写作提纲):
以下是根据这份报告整理的博客写作提纲，帮助你撰写一篇更具吸引力的博客文章：

文章结构和写作提示:
1. 开篇 (引言):
写作提示:
    用引人入胜的方式开篇，例如：
    简要介绍公司，并说明报告发布的目的。
    点出文章的核心观点或重点内容，例如：公司业绩增长，但面临市场挑战。
    突出报告中令人印象深刻的数据点：全年利润增长，或者宣布派发股息。
    吸引读者阅读全文。

2. 核心数据亮点 (文章主体):
写作提示:
    分段呈现: 将报告中的关键数据点分段展开，每个段落重点突出一个方面。
    使用小标题: 方便读者快速浏览和理解。
    配图: 适当插入图表或数据可视化，增强文章的可读性。
    数据呈现方式:
        强调百分比变化，让数据更具冲击力。
        对比去年同期数据，突出增长趋势。
	营收,税前盈利,净利,每股盈利
    提供解释: 不要仅仅罗列数据，要结合报告内容，解释数据背后的原因。
    举例说明: 用简单例子解释复杂概念，方便理解。


3. 风险与前景分析 (文章主体):
写作提示:
    客观分析: 既要看到机遇，也要指出潜在的风险。
    与行业趋势结合: 将公司面临的风险与整个行业的大环境联系起来。
    策略解读: 解释公司采取的策略，应对风险和抓住机遇。
    预测与展望: 对公司未来的发展做出合理的预测。

4. 总结与展望 (结论): (强制不能提出买卖建议/投资建议)
写作提示:
    简洁明了: 再次强调文章的核心观点。
    总结亮点: 总结财报中的主要积极因素。
    展望未来: 对公司未来发展前景做出积极的展望。
    激发读者思考: 鼓励读者关注公司未来的发展。

5. 结尾 (号召和引导):
写作提示:
    你也可以以你的专业观点，提出你的对这份报告的个人观点，保持客观
    提出问题: 例如：“你认为公司在未来几年内能保持这种增长势头吗？”
    鼓励互动: 邀请读者在评论区分享他们的看法。
    推荐相关文章: 引导读者阅读其他相关文章。

其他建议：
目标读者: 考虑你的目标读者是马来西亚散户投资者
语言风格: 使用清晰、简洁的语言。避免使用过于专业的术语，或者在第一次出现专业术语时进行解释。
搜索引擎优化 (SEO):
内容不需要注解

- 严格使用提供的CSS样式，特别是 <div class="highlight">, <div class="comparison">, <div class="comparison-item">, <span class="data-point">, <table>, 和 <div class="conclusion"> 这些元素的结构和类名要完全一致。
- 在<div class="comparison">中，将报告期的数据放在左侧的comparison-item，对比期的数据放在右侧的comparison-item。报告期的数据点使用<span class="data-point">包裹。以今年最新季度与去年同期季度作为对比
- 在<div class="conclusion">中，包含<h2>总结与投资建议</h2>，分析段落<p>，以及一个包含关键风险点的有序列表<ol>。
- 确保语言流畅、专业，适合财经博客的风格。
- 将占位符的内容自然地融入文章段落和列表中。
- 输出语言为中文。
- CCS Sytle 我已经有了，强制不需要输出  <style>
- 不要使用同比,YoY替代环比,QoQ来替代环比
- 不需要输出股票代码
- 强制不要输出html格式开头的` + '`' + `\`\`html 和结尾的\`\`\`` + `
- 不能提出买卖建议/投资建议
- 不要使用Markdown 格式

Report: {{media url=reportDataUri}}
`,
});

const analyzeKLSEReportFlow = ai.defineFlow(
  {
    name: 'analyzeKLSEReportFlow',
    inputSchema: AnalyzeKLSEReportInputSchema,
    outputSchema: AnalyzeKLSEReportOutputSchema,
  },
  async input => {
    const {apiKey, reportDataUri, geminiModel} = input;

    process.env.GOOGLE_GENAI_API_KEY = apiKey;

    const {output} = await analyzeKLSEReportPrompt(
      {
        reportDataUri: reportDataUri,
        geminiModel: geminiModel,
        apiKey: apiKey,
      },
      {
        model: `googleai/${geminiModel}`
      }
    );
    return output!;
  }
);
