import { motion } from 'framer-motion';
import Link from 'next/link';

import { MessageIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <MessageIcon size={32} />
        </p>
        <p>
          Dive into CFR Title 21 regulations with our specialized chatbot. 
          Our platform is updated weekly with the latest regulatory changes.
        </p>
        <p>
          For the best experience, please clearly mention the specific 
          CFR Title 21 subsections you wish to discuss in your messages.
          The AI assistant can also cite verbatim regulations for you, that you mention in that message.
        </p>
        <p>
          <Link
            href="/docs/ai-best-practices"
            className="font-medium underline underline-offset-4"
          >
            Learn More
          </Link>
        </p>
      </div>
    </motion.div>
  );
};