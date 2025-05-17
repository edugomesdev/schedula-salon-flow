// Inspired by react-hot-toast library
import * as React from "react"
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast" // Assuming this is from shadcn/ui

const TOAST_LIMIT = 1; // Show only one toast at a time
const TOAST_REMOVE_DELAY = 1000000; // Default delay for auto-remove (effectively infinite)

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// Removed actionTypes object as it was only used for type derivation
// const actionTypes = { // (Source 405)
//   ADD_TOAST: "ADD_TOAST",
//   UPDATE_TOAST: "UPDATE_TOAST",
//   DISMISS_TOAST: "DISMISS_TOAST",
//   REMOVE_TOAST: "REMOVE_TOAST",
// } as const;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// type ActionType = typeof actionTypes; // No longer needed

type Action =
  | {
      type: "ADD_TOAST"; // Used string literal directly
      toast: ToasterToast;
    }
  | {
      type: "UPDATE_TOAST"; // Used string literal directly
      toast: Partial<ToasterToast>;
    }
  | {
      type: "DISMISS_TOAST"; // Used string literal directly
      toastId?: ToasterToast["id"];
    }
  | {
      type: "REMOVE_TOAST"; // Used string literal directly
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    dispatch({ // dispatch is defined later, this is a common pattern in such state managers
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;
      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity (as in original shadcn)
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state; // Ensure all paths return a value
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id" | "open" | "onOpenChange">; // Made 'open' and 'onOpenChange' internal

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (updateProps: Partial<ToasterToast>) => // Changed props to updateProps for clarity
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...updateProps, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]); // state dependency is correct here for React's re-subscription logic

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
