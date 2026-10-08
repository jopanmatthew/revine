import type { Metadata } from "next";

import { RolePicker } from "./role-picker";

export const metadata: Metadata = { title: "Pick a role" };

export default function RolePickerPage() {
  return <RolePicker />;
}
