import { useI18n } from "@/lib/i18n";

export default function AssistantEmpty() {
  const { t } = useI18n();
  return (
    <div className="text-center text-sm text-muted-foreground py-8 px-4">
      {t("asst.empty")}
    </div>
  );
}