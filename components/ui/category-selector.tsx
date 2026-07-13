"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CategorySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  // Puedes añadir una prop para cargar categorías desde una API si es necesario
  // onCategoryCreated?: (newCategory: string) => void;
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<string[]>([
    "Sin categorizar",
  ]);
  const [inputValue, setInputValue] = React.useState(
    value || "Sin categorizar"
  );

  React.useEffect(() => {
    if (value) {
      setInputValue(value);
      if (!categories.includes(value)) {
        setCategories((prev) => [...prev, value]);
      }
    }
  }, [value, categories]);

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue);
    setInputValue(currentValue);
    setOpen(false);
  };

  const handleCreateCategory = () => {
    if (inputValue.trim() && !categories.includes(inputValue.trim())) {
      const newCategory = inputValue.trim();
      setCategories((prev) => [...prev, newCategory]);
      onChange(newCategory);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? categories.find((category) => category === value)
            : "Selecciona una categoría..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Buscar o agregar categoría..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              No se encontró la categoría.{" "}
              <Button
                variant="link"
                className="px-0 h-auto"
                onClick={handleCreateCategory}
              >
                Crear "{inputValue}"
                <PlusCircle className="ml-2 h-4 w-4" />
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category}
                  value={category}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
