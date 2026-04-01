import { toast } from "sonner";

export default function useToast() {
  return {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg),
    info: (msg) => toast(msg),
  };
}