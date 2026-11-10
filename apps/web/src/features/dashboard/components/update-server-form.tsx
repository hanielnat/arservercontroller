import { useForm, useSelector, type AnyFieldApi } from "@tanstack/react-form";
import {
  CableIcon,
  ChevronDownIcon,
  NetworkIcon,
  PlusIcon,
  RadioIcon,
  RotateCcwIcon,
  SaveIcon,
  TerminalIcon,
  Trash2Icon,
  VariableIcon,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useUpdateServer } from "@/hooks/use-server-mutation";
import { cn } from "@/lib/utils";
import {
  formValuesToUpdatePayload,
  type ServerConfig,
  type ServerUpdateFormValues,
} from "@/types/server";
import { ServerUpdateFormSchema } from "@/types/server.schema";

type EnvironmentFieldApi = Omit<AnyFieldApi, "state"> & {
  state: Omit<AnyFieldApi["state"], "value"> & {
    value: ServerUpdateFormValues["environment"];
  };
};

type ExtraPortsFieldApi = Omit<AnyFieldApi, "state"> & {
  state: Omit<AnyFieldApi["state"], "value"> & {
    value: ServerUpdateFormValues["extraPorts"];
  };
};

type CommandlineFieldApi = Omit<AnyFieldApi, "state"> & {
  state: Omit<AnyFieldApi["state"], "value"> & {
    value: ServerUpdateFormValues["commandLine"];
  };
};

function UndoButton({
  title,
  size,
  variant,
  disabled,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      title={title}
      disabled={disabled}
      className={cn(className)}
      {...props}
    >
      <RotateCcwIcon className="size-4" />
      {children}
    </Button>
  );
}

export function UpdateServerForm({
  config,
  className,
}: {
  config?: ServerConfig;
  className?: string;
}) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  const update = useUpdateServer();

  const defaultValues: ServerUpdateFormValues = {
    name: config?.name,
    bindPort: config?.bindPort,
    bindAddress: config?.bindAddress,
    a2sPort: config?.a2sPort,
    rconPort: config?.rconPort,
    containerId: config?.containerId,
    commandLine: config?.commandLine,
    environment: config?.environment,
    extraPorts: config?.extraPorts?.map(([key, value]) => ({ key, value })),
    reforgerConfig: config?.reforgerConfig ?? {},
  };

  const form = useForm({
    defaultValues,

    validators: {
      onSubmit: ServerUpdateFormSchema,
    },

    onSubmit: ({ value }) =>
      update.mutate(
        { id: config?.id ?? "", data: formValuesToUpdatePayload(value) },
        {
          onError: (error) =>
            toast.add({
              type: "error",
              title: "Error updating server.",
              description: error.message,
            }),
        },
      ),
  });

  const isDirty = useSelector(form.store, (state) => state.isDirty);

  const handleFormSubmit = (ev: React.SubmitEvent<HTMLFormElement>) => {
    ev.preventDefault();
    ev.stopPropagation();

    if (!form.state.isDirty) {
      toast.add({
        type: "error",
        title: "No value was changed.",
      });

      return;
    }

    form.handleSubmit();
  };

  const handleFormReset = (ev: React.SubmitEvent<HTMLFormElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    form.reset();
  };

  const renderEnvironment = (field: EnvironmentFieldApi) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    const record: Record<string, unknown> = Array.isArray(field.state.value)
      ? Object.fromEntries((field.state.value as string[]).map((v, i) => [`ITEM_${i}`, v]))
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
          <FieldLabel>
            <VariableIcon size={16} className="text-muted-foreground" />
            Environment
          </FieldLabel>

          <div className="flex items-center gap-2">
            {!field.state.meta.isDefaultValue && (
              <UndoButton
                size="icon-xs"
                variant="ghost"
                title="Reset environment"
                onClick={() => form.resetField("environment")}
              />
            )}
            <Button type="button" variant="outline" size="sm" onClick={add}>
              <PlusIcon size={16} className="text-muted-foreground" />
              Add
            </Button>
          </div>
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

              <Button type="button" variant="ghost" size="icon" onClick={() => remove(key)}>
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>

        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  };

  const renderExtraPorts = (field: ExtraPortsFieldApi) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field data-invalid={isInvalid}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>
            <CableIcon size={16} className="text-muted-foreground" />
            Extra Ports
          </FieldLabel>

          <div className="flex items-center gap-2">
            {!field.state.meta.isDefaultValue && (
              <UndoButton
                size="icon-xs"
                variant="ghost"
                title="Reset extra ports"
                onClick={() => form.resetField("extraPorts")}
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.pushValue({ key: "", value: 0 })}
            >
              <PlusIcon size={16} className="text-muted-foreground" />
              Add
            </Button>
          </div>
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
                <Trash2Icon />
              </Button>
            </div>
          ))}
        </div>

        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  };

  const renderCommandline = (field: CommandlineFieldApi) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field data-invalid={isInvalid}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>
            <TerminalIcon size={16} className="text-muted-foreground" />
            Launch Options
          </FieldLabel>

          <div className="flex items-center gap-2">
            {!field.state.meta.isDefaultValue && (
              <UndoButton
                size="icon-xs"
                variant="ghost"
                title="Reset launch options"
                onClick={() => form.resetField("commandLine")}
              />
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => field.pushValue("")}>
              <PlusIcon size={16} className="text-muted-foreground" />
              Add
            </Button>
          </div>
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
                    <Trash2Icon />
                  </Button>
                </div>
              )}
            />
          ))}
        </div>

        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  };

  return (
    <div className="flex size-full flex-col gap-8 p-2">
      <ButtonGroup>
        <Button type="submit" form="update-server-form" disabled={!isDirty}>
          <SaveIcon />
          Update
        </Button>

        <Button type="reset" form="update-server-form" variant="muted" disabled={!isDirty}>
          Reset
        </Button>
      </ButtonGroup>

      <form
        id="update-server-form"
        onSubmit={handleFormSubmit}
        onReset={handleFormReset}
        className={cn("flex flex-col max-w-lg space-y-8 sm:shrink-0", className)}
      >
        <FieldGroup className="space-y-2">
          {/* Bind Address */}
          <form.Field
            name="bindAddress"
            children={(field) => {
              const isDirty = !field.state.meta.isDefaultValue;
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    <NetworkIcon size={16} className="text-muted-foreground" />
                    Bind Address
                    {isDirty && (
                      <UndoButton
                        size="icon-xs"
                        variant="ghost"
                        title="Reset bind address"
                        onClick={() => form.resetField("bindAddress")}
                      />
                    )}
                  </FieldLabel>
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
              const isDirty = !field.state.meta.isDefaultValue;
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    <RadioIcon size={16} className="text-muted-foreground" />
                    Bind Port (UDP)
                    {isDirty && (
                      <UndoButton
                        size="icon-xs"
                        variant="ghost"
                        title="Reset bind port"
                        onClick={() => form.resetField("bindPort")}
                      />
                    )}
                  </FieldLabel>
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
              const isDirty = !field.state.meta.isDefaultValue;
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    <RadioIcon size={16} className="text-muted-foreground" />
                    A2S Port (UDP)
                    {isDirty && (
                      <UndoButton
                        size="icon-xs"
                        variant="ghost"
                        title="Reset A2S port"
                        onClick={() => form.resetField("a2sPort")}
                      />
                    )}
                  </FieldLabel>
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
              const isDirty = !field.state.meta.isDefaultValue;
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    <RadioIcon size={16} className="text-muted-foreground" />
                    RCON Port (UDP)
                    {isDirty && (
                      <UndoButton
                        size="icon-xs"
                        variant="ghost"
                        title="Reset RCON port"
                        onClick={() => form.resetField("rconPort")}
                      />
                    )}
                  </FieldLabel>
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

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger
            render={
              <Button
                variant="outline"
                size="default"
                className="w-full data-panel-open:rounded-b-none"
              >
                Advanced properties
                <ChevronDownIcon
                  size={16}
                  className="ml-auto group-data-panel-open/button:rotate-180"
                />
              </Button>
            }
          />

          <CollapsibleContent className="space-y-8 rounded-md rounded-tl-none rounded-tr-none border border-t-0 p-4">
            <FieldGroup>
              {/* Launch Options */}
              <form.Field name="commandLine" mode="array" children={renderCommandline} />
              {/* Environment */}
              <form.Field name="environment" children={renderEnvironment} />
              {/* Extra Ports */}
              <form.Field name="extraPorts" mode="array" children={renderExtraPorts} />
            </FieldGroup>
          </CollapsibleContent>
        </Collapsible>
      </form>
    </div>
  );
}
