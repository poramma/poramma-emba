import React from 'react';

type Tab = "calendar" | "slots" | "requests";

interface TabsProps {
    tabs: { id: string; label: string; icon: React.ReactNode }[];
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

const Tabs : React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id as Tab)}
                    className={tab.id === activeTab ? 'active' : ''}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export default Tabs;
