import React from 'react';
import { ToolConfig, ToolCategory, CATEGORY_LABELS } from '../types';

interface SidebarProps {
    tools: ToolConfig[];
    activeTool: ToolConfig;
    onToolSelect: (tool: ToolConfig) => void;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

// Define category order
const CATEGORY_ORDER: ToolCategory[] = [
    'format',
    'edit',
    'watermark',
    'collage',
    'ai',
    'color',
    'video',
    'animation',
];

export const Sidebar: React.FC<SidebarProps> = ({
    tools,
    activeTool,
    onToolSelect,
    isMobileOpen,
    onMobileClose
}) => {
    // Group tools by category
    const categories = CATEGORY_ORDER.map(cat => ({
        key: cat,
        label: CATEGORY_LABELS[cat],
        tools: tools.filter(t => t.category === cat)
    })).filter(cat => cat.tools.length > 0);

    const handleToolClick = (tool: ToolConfig) => {
        if (tool.disabled) return;
        onToolSelect(tool);
        onMobileClose();
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-gradient-to-b from-slate-900 to-slate-800
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-2xl
        `}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-700/50">
                    <h1 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            图片工具箱
                        </span>
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {categories.map((category) => (
                        <div key={category.key}>
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                                {category.label}
                            </h3>
                            <ul className="space-y-1">
                                {category.tools.map((tool) => {
                                    const Icon = tool.icon;
                                    const isActive = activeTool.id === tool.id;
                                    const isDisabled = tool.disabled;
                                    return (
                                        <li key={tool.id}>
                                            <button
                                                onClick={() => handleToolClick(tool)}
                                                disabled={isDisabled}
                                                className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-left transition-all duration-200
                            ${isDisabled
                                                        ? 'text-slate-600 cursor-not-allowed opacity-50'
                                                        : isActive
                                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                                    }
                          `}
                                            >
                                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                                <span className="font-medium text-sm">{tool.name}</span>
                                                {isDisabled && (
                                                    <span className="ml-auto text-xs bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                                                        即将上线
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>


            </aside>
        </>
    );
};
