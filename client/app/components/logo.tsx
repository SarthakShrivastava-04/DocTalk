import { MessageCircleQuestion } from 'lucide-react';

export const Logo = () => {
  return (
    <div className="flex items-center justify-center gap-1">
        <MessageCircleQuestion className='w-6 h-6'/>
        <span className="text-balance text-xl mb-1">DocTalk</span>
    </div>
  );
};

