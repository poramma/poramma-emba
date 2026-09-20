import React from "react";

interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  content?: React.ReactNode;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabsProps<T>) {
  const tabsContainer = (
    <div
      className={`
        inline-flex
        items-center
        gap-1
        rounded-xl
        border
        border-gray-200
        bg-gray-50
        p-1
        dark:border-gray-800
        dark:bg-gray-900
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex
              items-center
              gap-2
              rounded-lg
              px-4
              py-2
              text-sm
              font-medium
              transition-all
              duration-200

              ${
                active
                  ? "bg-white text-brand-600 shadow-sm dark:bg-gray-800 dark:text-brand-400"
                  : "text-gray-500 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }
            `}
          >
            {tab.icon}

            <span>{tab.label}</span>

            {tab.badge}
          </button>
        );
      })}
    </div>
  );

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <>
      {tabsContainer}
      {activeTabContent && <div className="mt-4">{activeTabContent}</div>}
    </>
  );
}

interface TabPanelProps<T extends string> {
  id: T;
  label?: string;
  activeTab: T;
  children: React.ReactNode;
}

export function TabPanel<T extends string>({ id, activeTab, children }: TabPanelProps<T>) {
  if (id !== activeTab) return null;
  return <div className="mt-4">{children}</div>;
}