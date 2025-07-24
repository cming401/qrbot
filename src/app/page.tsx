"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { analyzeKLSEReport } from "@/ai/flows/analyze-klse-report";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Bot, X, WandSparkles, TriangleAlert } from "lucide-react";

// Form schema for validation
const formSchema = z.object({
  apiKey: z.string().min(1, { message: "Google Gemini API 密钥是必需的。" }),
  model: z.enum(['gemini-2.5-pro', 'gemini-2.5-flash']),
});

export default function KLSEAnalyzerPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      model: "gemini-2.5-flash",
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      toast({
        variant: "destructive",
        title: "文件类型无效",
        description: "请上传 PDF 格式的文件。",
      });
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!file) {
      setError("请上传一份季度报告 PDF。");
      return;
    }
    setError(null);
    setAnalysisResult(null);
    setIsLoading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);

    try {
      const reportDataUri = await fileToBase64(file);
      const result = await analyzeKLSEReport({
        reportDataUri,
        geminiModel: values.model,
        apiKey: values.apiKey,
      });

      setAnalysisResult(result.blogPostHtml);
      setProgress(100);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "发生未知错误。";
      setError(`分析失败：${errorMessage}`);
      toast({
        variant: "destructive",
        title: "分析出错",
        description: "无法分析报告。请检查您的 API 密钥和文件，然后重试。",
      });
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };
  
  const resetState = () => {
    setFile(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
    setProgress(0);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    form.reset();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Bot className="animate-pulse text-primary" />
              分析进行中...
            </CardTitle>
            <CardDescription>AI 正在为您解析财报，请稍候。</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (analysisResult) {
    return (
      <main className="container mx-auto p-4 sm:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <WandSparkles className="text-primary"/>
                  分析结果
                </CardTitle>
                <CardDescription>这是为您生成的财报博客文章。</CardDescription>
              </div>
              <Button onClick={resetState} variant="outline">分析另一份报告</Button>
            </div>
          </CardHeader>
          <CardContent>
             <div className="blog-post-content bg-background p-4 sm:p-6 rounded-lg border" dangerouslySetInnerHTML={{ __html: analysisResult }} />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">KLSE 财报博主</CardTitle>
          <CardDescription>
            拖放您的 Bursa KLSE 季度报告 PDF，让 AI 为您生成一篇专业的博客文章。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div
                className="relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-primary" />
                    <p className="mt-2 font-semibold">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                     <Button variant="ghost" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); setFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>
                        <X className="h-4 w-4 mr-2" />
                        移除文件
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 font-semibold">拖放 PDF 文件到此处</p>
                    <p className="text-sm text-muted-foreground">或点击选择文件</p>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Gemini API 密钥</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="请输入您的 API 密钥" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>选择模型</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择一个 AI 模型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <Alert variant="destructive">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={!file || form.formState.isSubmitting}>
                分析财报
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            免责声明：本工具生成的分析仅供参考，不构成任何投资建议。请谨慎决策。
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
