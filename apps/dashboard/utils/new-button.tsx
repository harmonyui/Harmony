"use client";

import { Button } from "@harmony/ui/src/components/core/button";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { setCookie } from "./server-actions";

export const NewButton = () => {
  useEffect(() => {
    async function initialize() {
      await setCookie("harmony-user-id", "none");
      redirect("/");
    }
    initialize();
  }, []);

  return <></>;
};
