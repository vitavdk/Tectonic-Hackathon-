export interface FlowProps {
  /** Call when the main action is finished; Kate then asks for feedback. */
  onDone: () => void;
}
