import { buttonStyles, type ButtonSize, type ButtonVariant } from '@/components/ui/button-styles';

type Props = React.ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className, type = 'button', ...props }: Props) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}