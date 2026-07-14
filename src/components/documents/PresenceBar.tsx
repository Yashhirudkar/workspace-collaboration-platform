"use client";

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Collaborator } from '@/hooks/usePresence';

interface Props {
  collaborators: Collaborator[];
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function PresenceBar({ collaborators }: Props) {
  if (collaborators.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
        No other editors
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground font-medium mr-1">Editing now:</span>
      <div className="flex -space-x-2 overflow-hidden">
        {collaborators.map((c) => (
          <div
            key={c.userId}
            className="relative group transition-transform hover:translate-y-[-2px] duration-150 cursor-default"
          >
            {/* Avatar Circle */}
            <Avatar className="h-7 w-7 border-2 border-background select-none">
              <AvatarFallback className={`${c.color} text-[10px] font-semibold tracking-wider`}>
                {getInitials(c.name)}
              </AvatarFallback>
            </Avatar>

            {/* Custom Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0f172a] text-white text-[10px] font-medium rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              <div className="flex flex-col gap-0.5 items-center">
                <span>{c.name}</span>
                {c.currentLine !== undefined && (
                  <span className="text-white/60 text-[9px] font-normal">
                    Line {c.currentLine}
                  </span>
                )}
              </div>
              {/* Tooltip triangle arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0f172a]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
