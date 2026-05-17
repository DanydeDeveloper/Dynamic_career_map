"use client";

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

export function SubmitButton({
  children,
  pendingText = "Сохраняем...",
  className = "button primary",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending || disabled} type="submit" {...props}>
      {pending ? (
        <>
          <LoaderCircle className="button-spinner" size={16} aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

type FormPendingNoticeProps = {
  title?: string;
  description?: string;
};

export function FormPendingNotice({
  title = "Запрос обрабатывается",
  description = "Не закрывайте страницу: сохраняем изменения и обновляем данные."
}: FormPendingNoticeProps) {
  const { pending } = useFormStatus();

  if (!pending) {
    return null;
  }

  return (
    <div className="form-pending-notice" role="status" aria-live="assertive">
      <LoaderCircle className="button-spinner" size={18} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  );
}
