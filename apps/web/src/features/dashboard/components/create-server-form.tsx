import { useForm } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CodeTextArea } from "@/components/ui/code-textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useAddServer } from "@/hooks/use-server-mutation";
import { formValuesToCreatePayload, type ServerCreateFormValues } from "@/types/server";
import { ServerCreateFormSchema } from "@/types/server.schema";

type CreateServerFormProps = {
  children?: (state: { canSubmit: boolean; isSubmitting: boolean }) => React.ReactNode;
};

const defaultValues: ServerCreateFormValues = {
  name: "",
  bindPort: 2001,
  bindAddress: "0.0.0.0",
  a2sPort: 17777,
  rconPort: 19999,
  status: undefined,
  commandLine: ["-logLevel", "spam"],
  environment: undefined,
  extraPorts: undefined,
  reforgerConfig: `{
  "rcon": {
    "address": "0.0.0.0",
    "port": 18787,
    "password": "rcon",
    "permission": "monitor",
    "blacklist": [],
    "whitelist": []
  },
  "game": {
    "name": "Test ARServer",
    "password": "arserver",
    "passwordAdmin": "arserver",
    "admins": [],
    "scenarioId": "{2BBBE828037C6F4B}Missions/22_GM_Arland.conf",
    "maxPlayers": 128,
    "visible": true,
    "gameProperties": {
      "serverMaxViewDistance": 1600,
      "serverMinGrassDistance": 50,
      "networkViewDistance": 1500,
      "fastValidation": true,
      "battlEye": true
    },
    "mods": [
      {
        "modId": "5965550F24A0C152",
        "name": "Where Am I",
        "version": "1.2.0"
      }
    ]
  }
}
  `,
};

export function CreateServerForm({ children }: CreateServerFormProps) {
  const add = useAddServer();

  const form = useForm({
    defaultValues,

    validators: {
      onSubmit: ServerCreateFormSchema,
    },

    onSubmit: async ({ value }) => {
      const payload = formValuesToCreatePayload(value);
      console.log("payload:", payload);

      add.mutate(payload, {
        onError: (error) =>
          toast.add({
            title: "Error creating server.",
            description: error.message,
          }),
        onSuccess: () =>
          toast.add({
            title: "Server created successfully!",
          }),
      });
    },
  });

  return (
    <form
      id="create-server-form"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-8 sm:flex-row"
    >
      <div className="w-full space-y-8 sm:max-w-1/3 sm:shrink-0">
        <FieldGroup className="space-y-4">
          {/* Name */}
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Server name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="op-server"
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          {/* Bind Address */}
          <form.Field
            name="bindAddress"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Bind Address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0.0.0.0"
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          {/* Bind Port */}
          <form.Field
            name="bindPort"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Bind Port (UDP)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    placeholder="2001"
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          {/* A2S Port */}
          <form.Field
            name="a2sPort"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>A2S Port (UDP)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    placeholder="17777"
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          {/* RCON Port */}
          <form.Field
            name="rconPort"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>RCON Port (UDP)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    placeholder="19999"
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </FieldGroup>

        <FieldGroup className="space-y-4">
          {/* Launch Options */}
          <form.Field
            name="commandLine"
            mode="array"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel>Launch Options</FieldLabel>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.pushValue("")}
                    >
                      <Plus className="size-4" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(field.state.value ?? []).map((_, index) => (
                      <form.Field
                        key={index}
                        name={`commandLine[${index}]`}
                        children={(subField) => (
                          <div className="flex gap-2">
                            <Input
                              value={subField.state.value ?? ""}
                              onBlur={subField.handleBlur}
                              onChange={(e) => subField.handleChange(e.target.value)}
                              placeholder="-logLevel spam"
                              autoComplete="off"
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => field.removeValue(index)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        )}
                      />
                    ))}
                  </div>

                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Environment */}
          <form.Field
            name="environment"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

              const record: Record<string, unknown> = Array.isArray(field.state.value)
                ? Object.fromEntries(
                    (field.state.value as string[]).map((v, i) => [`ITEM_${i}`, v]),
                  )
                : ((field.state.value as Record<string, unknown>) ?? {});

              const entries = Object.entries(record);

              const commit = (next: Record<string, unknown>) => {
                field.handleChange(next);
              };

              const updateKey = (oldKey: string, newKey: string) => {
                if (oldKey === newKey) {
                  return;
                }

                const next = { ...record };
                next[newKey] = next[oldKey];
                delete next[oldKey];
                commit(next);
              };

              const updateValue = (key: string, value: string) => {
                commit({ ...record, [key]: value });
              };

              const remove = (key: string) => {
                const next = { ...record };
                delete next[key];
                commit(next);
              };

              const add = () => {
                commit({ ...record, "": "" });
              };

              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel>Environment</FieldLabel>

                    <Button type="button" variant="outline" size="sm" onClick={add}>
                      <Plus className="size-4" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {entries.map(([key, value], index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={key}
                          onChange={(e) => updateKey(key, e.target.value)}
                          placeholder="KEY"
                          className="w-[40%]"
                          autoComplete="off"
                        />

                        <Input
                          value={String(value ?? "")}
                          onChange={(e) => updateValue(key, e.target.value)}
                          placeholder="value"
                          className="flex-1"
                          autoComplete="off"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(key)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          {/* Extra Ports */}
          <form.Field
            name="extraPorts"
            mode="array"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel>Extra Ports</FieldLabel>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.pushValue({ key: "", value: 0 })}
                    >
                      <Plus className="size-4" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(field.state.value ?? []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item?.key ?? ""}
                          onChange={(e) => {
                            field.replaceValue(index, {
                              key: e.target.value,
                              value: item?.value ?? 0,
                            });
                          }}
                          placeholder="protocol"
                          className="w-[40%]"
                          autoComplete="off"
                        />

                        <Input
                          type="number"
                          value={item?.value === 0 && !item?.key ? "" : (item?.value ?? "")}
                          onChange={(e) =>
                            field.replaceValue(index, {
                              key: item?.key ?? "",
                              value: e.target.valueAsNumber || 0,
                            })
                          }
                          placeholder="port"
                          className="flex-1"
                          autoComplete="off"
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => field.removeValue(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </div>

      <div className="sticky top-0 flex-1 self-start">
        {/* Reforger Config */}
        <form.Field
          name="reforgerConfig"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field className="flex h-full flex-col" data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Reforger Config</FieldLabel>

                <CodeTextArea
                  lang="json"
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  error={isInvalid}
                  minHeight="71vh"
                  maxHeight="calc(100vh - 230px)"
                  className="h-[71vh] max-h-[calc(100vh-230px)]"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </div>

      {children ? (
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          children={([canSubmit, isSubmitting]) => children({ canSubmit, isSubmitting })}
        />
      ) : null}
    </form>
  );
}
