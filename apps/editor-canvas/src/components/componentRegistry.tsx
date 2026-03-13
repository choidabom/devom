import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Toggle } from "@/components/ui/toggle"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type ContentRenderer = (props: Record<string, unknown>, editorMode: "edit" | "interact") => React.ReactNode

const registry: Record<string, ContentRenderer> = {
  text: (props) => String(props.content ?? "Text"),

  button: (props) => String(props.label ?? "Button"),

  input: (props, editorMode) => (
    <input
      placeholder={String(props.placeholder ?? "")}
      style={{ width: "100%", border: "none", outline: "none", background: "transparent", font: "inherit", color: "inherit", padding: 0 }}
      readOnly={editorMode === "edit"}
    />
  ),

  image: (props) =>
    props.src ? (
      <img src={String(props.src)} alt={String(props.alt ?? "")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>Image</div>
    ),

  video: (props) =>
    props.src ? (
      <video
        src={String(props.src)}
        autoPlay={props.autoplay !== false}
        muted={props.muted !== false}
        loop={props.loop !== false}
        controls={Boolean(props.controls)}
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>Video</div>
    ),

  "sc:button": (props) => (
    <Button
      variant={(props.variant as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link") ?? "default"}
      size={(props.size as "default" | "sm" | "lg" | "icon") ?? "default"}
    >
      {String(props.label ?? "Button")}
    </Button>
  ),

  "sc:card": (props) => (
    <Card>
      <CardHeader>
        <CardTitle>{String(props.title ?? "Card Title")}</CardTitle>
        <CardDescription>{String(props.description ?? "")}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{String(props.content ?? "")}</p>
      </CardContent>
    </Card>
  ),

  "sc:input": (props, editorMode) => <Input placeholder={String(props.placeholder ?? "")} type={String(props.type ?? "text")} readOnly={editorMode === "edit"} />,

  "sc:badge": (props) => <Badge variant={(props.variant as "default" | "secondary" | "destructive" | "outline") ?? "default"}>{String(props.label ?? "Badge")}</Badge>,

  "sc:checkbox": (props) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="cb" />
      <Label htmlFor="cb">{String(props.label ?? "Check")}</Label>
    </div>
  ),

  "sc:switch": (props) => (
    <div className="flex items-center space-x-2">
      <Switch id="sw" />
      <Label htmlFor="sw">{String(props.label ?? "Switch")}</Label>
    </div>
  ),

  "sc:label": (props) => <Label>{String(props.text ?? "Label")}</Label>,

  "sc:textarea": (props, editorMode) => <Textarea placeholder={String(props.placeholder ?? "")} rows={Number(props.rows ?? 3)} readOnly={editorMode === "edit"} />,

  "sc:avatar": (props) => (
    <Avatar>
      {props.src ? <AvatarImage src={String(props.src)} /> : null}
      <AvatarFallback>{String(props.fallback ?? "?")}</AvatarFallback>
    </Avatar>
  ),

  "sc:separator": (props) => <Separator orientation={(props.orientation as "horizontal" | "vertical") ?? "horizontal"} />,

  "sc:progress": (props) => <Progress value={Number(props.value ?? 0)} />,

  "sc:skeleton": () => (
    <div className="space-y-2" style={{ width: "100%" }}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),

  "sc:slider": (props) => <Slider defaultValue={[Number(props.value ?? 50)]} min={Number(props.min ?? 0)} max={Number(props.max ?? 100)} step={Number(props.step ?? 1)} />,

  "sc:tabs": (props) => {
    const tabs = (props.tabs as string[]) ?? ["Tab 1", "Tab 2"]
    return (
      <Tabs defaultValue={String(props.activeTab ?? tabs[0])}>
        <TabsList>
          {tabs.map((t: string) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t: string) => (
          <TabsContent key={t} value={t}>
            <p className="text-sm text-muted-foreground p-2">{t} content</p>
          </TabsContent>
        ))}
      </Tabs>
    )
  },

  "sc:alert": (props) => (
    <Alert variant={(props.variant as "default" | "destructive") ?? "default"}>
      <AlertTitle>{String(props.title ?? "Alert")}</AlertTitle>
      <AlertDescription>{String(props.description ?? "")}</AlertDescription>
    </Alert>
  ),

  "sc:toggle": (props) => <Toggle>{String(props.label ?? "Toggle")}</Toggle>,

  "sc:select": (props) => {
    const options = (props.options as string[]) ?? ["Option 1"]
    return (
      <Select defaultValue={options[0]}>
        <SelectTrigger>
          <SelectValue placeholder={String(props.placeholder ?? "Select")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o: string) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  },

  "sc:table": (props) => {
    const headers = (props.headers as string[]) ?? ["Column"]
    const rows = (props.rows as string[][]) ?? []
    return (
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h: string) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row: string[], i: number) => (
            <TableRow key={i}>
              {row.map((cell: string, j: number) => (
                <TableCell key={j}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  },

  "sc:accordion": (props) => {
    const items = (props.items as Array<{ title: string; content: string }>) ?? []
    return (
      <Accordion>
        {items.map((item, i) => (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    )
  },

  "sc:radio-group": (props) => {
    const options = (props.options as string[]) ?? ["Option 1"]
    return (
      <RadioGroup defaultValue={String(props.value ?? options[0])}>
        {options.map((o: string) => (
          <div key={o} className="flex items-center space-x-2">
            <RadioGroupItem value={o} id={`r-${o}`} />
            <Label htmlFor={`r-${o}`}>{o}</Label>
          </div>
        ))}
      </RadioGroup>
    )
  },

  form: () => null, // children rendered by ElementRenderer, form tag wraps them
}

export function getElementContent(type: string, props: Record<string, unknown>, editorMode: "edit" | "interact"): React.ReactNode {
  const renderer = registry[type]
  return renderer ? renderer(props, editorMode) : null
}
