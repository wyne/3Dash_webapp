import { icons, type LucideProps } from 'lucide-react';

interface Props extends LucideProps {
  name: string;
}

export default function LucideIcon({ name, ...props }: Props) {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon {...props} />;
}
