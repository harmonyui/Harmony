import { useEffect, useState } from "react";

export const useFadeout = ({
  fade,
  onFaded,
}: {
  fade: boolean;
  onFaded: () => void;
}) => {
  const [transparency, setTransparency] = useState(1);

  useEffect(() => {
    if (fade) {
      const decresaseTransparency = (_transparency: number) => {
        if (_transparency <= 0) {
          onFaded();
          return;
        }
        const newTrans = _transparency - 0.05;
        setTransparency(Math.max(0, newTrans));
        setTimeout(() => {
          decresaseTransparency(newTrans);
        }, 50);
      };
      setTransparency(1);
      setTimeout(() => {
        decresaseTransparency(1);
      }, 5000);
    }
  }, [fade]);

  return transparency;
};
