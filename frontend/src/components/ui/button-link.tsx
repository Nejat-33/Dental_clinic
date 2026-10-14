import Link from 'next/link';
import { buttonStyles, type ButtonSize, type ButtonVariant } from '@/components/ui/button-styles';

type Props = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({ href, variant, size, className, ...props }: Props) {
  return <Link href={href} className={buttonStyles({ variant, size, className })} {...props} />;
}