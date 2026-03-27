import { useState } from "react";
import { cn } from "@/utils/cn";

export interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultActiveKey, onChange, className }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey ?? tabs[0]?.key ?? "");

  const handleChange = (key: string) => {
    setActiveKey(key);
    onChange?.(key);
  };

  const activeTab = tabs.find((tab) => tab.key === activeKey);

  return (
    <div className={className}>
      <div role="tablist" className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={tab.key === activeKey}
            onClick={() => handleChange(tab.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              tab.key === activeKey
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {activeTab?.content}
      </div>
    </div>
  );
}
