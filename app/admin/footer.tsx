import React, { useEffect, useState } from "react";
import { Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { colors, spacing, radius, typography } from "@/lib/theme";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton } from "@/components/Shared";
import { supabase } from "@/lib/supabase";

export default function AdminFooter() {
  const [footerText, setFooterText] = useState("");
  const [copyrightText, setCopyrightText] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [aboutApp, setAboutApp] = useState("");
  const [legalTerms, setLegalTerms] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("settings").select("*").eq("id", "global").maybeSingle();
      if (data) {
        setFooterText(data.footer_text ?? "");
        setCopyrightText(data.copyright_text ?? "");
        setWhatsapp(data.whatsapp_number ?? "");
        setFacebook(data.facebook_url ?? "");
        setInstagram(data.instagram_url ?? "");
        const content = (data.content ?? {}) as any;
        setAboutApp(content.about_app ?? "");
        setLegalTerms(content.legal_terms ?? "");
        setSupportEmail(data.support_email ?? "");
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: current } = await supabase.from("settings").select("content").eq("id", "global").maybeSingle();
    const content = { ...((current?.content ?? {}) as object), about_app: aboutApp, legal_terms: legalTerms };
    const { error } = await supabase
      .from("settings")
      .update({
        footer_text: footerText,
        copyright_text: copyrightText,
        whatsapp_number: whatsapp,
        facebook_url: facebook,
        instagram_url: instagram,
        support_email: supportEmail.trim(),
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "global");
    setSaving(false);
    setMessage(error ? error.message : "Footer saved.");
  };

  return (
    <AdminShell title="Footer">
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Footer text</Text>
        <TextInput style={[styles.input, styles.area]} value={footerText} onChangeText={setFooterText} multiline />
        <Text style={styles.label}>Copyright</Text>
        <TextInput style={styles.input} value={copyrightText} onChangeText={setCopyrightText} />
        <Text style={styles.label}>WhatsApp number</Text>
        <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} />
        <Text style={styles.label}>Facebook URL</Text>
        <TextInput style={styles.input} value={facebook} onChangeText={setFacebook} autoCapitalize="none" />
        <Text style={styles.label}>Instagram URL</Text>
        <TextInput style={styles.input} value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
        <Text style={styles.label}>Support email</Text>
        <TextInput style={styles.input} value={supportEmail} onChangeText={setSupportEmail} autoCapitalize="none" keyboardType="email-address" />
        <Text style={styles.label}>About this app</Text>
        <TextInput style={[styles.input, styles.area]} value={aboutApp} onChangeText={setAboutApp} multiline />
        <Text style={styles.label}>Legal terms & policies</Text>
        <TextInput style={[styles.input, styles.area]} value={legalTerms} onChangeText={setLegalTerms} multiline />
        {message ? <Text style={styles.msg}>{message}</Text> : null}
        <PrimaryButton label="Save footer" onPress={save} loading={saving} />
      </ScrollView>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  label: { fontFamily: typography.bodySemibold, marginBottom: 6, marginTop: spacing.md, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  area: { minHeight: 90, textAlignVertical: "top" },
  msg: { color: colors.primary, marginVertical: spacing.md },
});
