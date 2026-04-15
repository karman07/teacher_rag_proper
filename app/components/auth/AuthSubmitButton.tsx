'use client';

import { Button } from '@heroui/react';
import { COLORS } from '../../constants/colors';

interface AuthSubmitButtonProps {
  label: string;
  isLoading?: boolean;
}

/**
 * AuthSubmitButton
 * Gradient primary HeroUI Button for form submission.
 */
export default function AuthSubmitButton({ label, isLoading }: AuthSubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      isLoading={isLoading}
      fullWidth
      className="font-semibold text-white rounded-xl h-12 text-[15px] shadow-lg shadow-blue-600/25"
      style={{ backgroundColor: COLORS.primary[600] }}
    >
      {!isLoading && label}
    </Button>
  );
}
