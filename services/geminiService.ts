import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool Definitions ---

const generateVisualizationTool: FunctionDeclaration = {
  name: "generateVisualization",
  description: "Create a chart visualization based on the dataset.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: { 
        type: Type.STRING, 
        enum: ["bar", "line", "scatter", "pie", "doughnut", "area", "heatmap", "bubble", "box", "venn", "contour"], 
        description: "The type of chart. Use 'venn' for set intersection, 'box' for distribution stats, 'bubble' for 3 variables, 'doughnut' for parts-to-whole." 
      },
      xAxisKey: { type: Type.STRING, description: "The column name for the X-axis (or Group by)." },
      yAxisKey: { type: Type.STRING, description: "The column name for the Y-axis. For Bubble/Scatter, this is the vertical value." },
      zAxisKey: { type: Type.STRING, description: "The column name for the Z-axis (Size), used specifically for Bubble charts." },
      title: { type: Type.STRING, description: "A descriptive title for the chart." }
    },
    required: ["type", "xAxisKey", "title"]
  }
};

const cleanDataTool: FunctionDeclaration = {
  name: "cleanData",
  description: "Perform data cleaning operations like removing outliers, imputing missing values, or dropping rows with null values.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      operation: { 
        type: Type.STRING, 
        enum: ["remove_outliers", "impute_mean", "drop_missing"], 
        description: "The cleaning operation to perform: 'remove_outliers' uses IQR method, 'impute_mean' fills nulls with column average, 'drop_missing' removes rows with any nulls in this column." 
      },
      column: { type: Type.STRING, description: "The column to apply the cleaning operation on." }
    },
    required: ["operation", "column"]
  }
};

const createDashboardItemTool: FunctionDeclaration = {
  name: "addToDashboard",
  description: "Add the current visualization configuration to the main dashboard.",
  parameters: {
    type: Type.OBJECT,
    properties: {
        note: { type: Type.STRING, description: "A short note about why this was added."}
    }
  }
};

const tools: Tool[] = [{
  functionDeclarations: [generateVisualizationTool, cleanDataTool, createDashboardItemTool]
}];

export const getGeminiResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  dataContext: string,
  modelName: string = "gemini-3-flash-preview"
) => {
  const systemInstruction = `
    You are "InsightFlow", an advanced Data Analyst AI.
    
    Data Context (Current Dataset):
    ${dataContext}

    Your capabilities:
    1. VISUALIZATION: Use 'generateVisualization' for any chart request.
    2. CLEANING: If data appears messy or the user requests it, use 'cleanData'. 
       - Recommend 'remove_outliers' if user mentions anomalies or extreme values.
       - Recommend 'impute_mean' for numeric columns with missing values.
       - Recommend 'drop_missing' if quality is more important than quantity.
    3. DASHBOARD: Use 'addToDashboard' when a user likes a generated chart.

    Tone: Helpful, data-driven, and proactive. If you see missing values in the context, suggest cleaning them.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: history.map(h => ({ role: h.role, parts: h.parts })),
      config: {
        tools: tools,
        systemInstruction: systemInstruction,
        temperature: 0.2,
      }
    });
    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};