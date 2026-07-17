import { toast } from "sonner";

const baseOptions = {
  classNames: {
    toast: "ui-sonner-toast",
  },
} as const;

export function toastError(message: string) {
  toast.error(message, baseOptions);
}

export function toastSuccess(message: string) {
  toast.success(message, baseOptions);
}

export function toastWarning(message: string) {
  toast.warning(message, baseOptions);
}

export function toastInfo(message: string) {
  toast.info(message, baseOptions);
}
