/**
 * HugeIcons wrapper components.
 * Icons come from @hugeicons/core-free-icons (data) and are
 * rendered via @hugeicons/react (HugeiconsIcon component).
 */
import { HugeiconsIcon } from '@hugeicons/react'
import type { HugeiconsIconProps } from '@hugeicons/react'
import {
  Add01Icon as Add01IconData,
  Calendar01Icon as Calendar01IconData,
  CheckListIcon as CheckListIconData,
  Delete01Icon as Delete01IconData,
  FilterIcon as FilterIconData,
  HashtagIcon as HashtagIconData,
  KanbanIcon as KanbanIconData,
  PencilEdit01Icon as PencilEdit01IconData,
  Settings01Icon as Settings01IconData,
  Sorting01Icon as Sorting01IconData,
  TableIcon as TableIconData,
  Task01Icon as Task01IconData,
  TextSquareIcon as TextSquareIconData,
  Tick02Icon as Tick02IconData,
} from '@hugeicons/core-free-icons'

type IconProps = Omit<HugeiconsIconProps, 'icon'>

export const Add01Icon = (p: IconProps) => <HugeiconsIcon icon={Add01IconData} {...p} />
export const Calendar01Icon = (p: IconProps) => <HugeiconsIcon icon={Calendar01IconData} {...p} />
export const CheckListIcon = (p: IconProps) => <HugeiconsIcon icon={CheckListIconData} {...p} />
export const Delete01Icon = (p: IconProps) => <HugeiconsIcon icon={Delete01IconData} {...p} />
export const FilterIcon = (p: IconProps) => <HugeiconsIcon icon={FilterIconData} {...p} />
export const HashtagIcon = (p: IconProps) => <HugeiconsIcon icon={HashtagIconData} {...p} />
export const KanbanIcon = (p: IconProps) => <HugeiconsIcon icon={KanbanIconData} {...p} />
export const PencilEdit01Icon = (p: IconProps) => <HugeiconsIcon icon={PencilEdit01IconData} {...p} />
export const Settings01Icon = (p: IconProps) => <HugeiconsIcon icon={Settings01IconData} {...p} />
export const Sorting01Icon = (p: IconProps) => <HugeiconsIcon icon={Sorting01IconData} {...p} />
export const TableIcon = (p: IconProps) => <HugeiconsIcon icon={TableIconData} {...p} />
export const Task01Icon = (p: IconProps) => <HugeiconsIcon icon={Task01IconData} {...p} />
export const TextSquareIcon = (p: IconProps) => <HugeiconsIcon icon={TextSquareIconData} {...p} />
export const Tick02Icon = (p: IconProps) => <HugeiconsIcon icon={Tick02IconData} {...p} />
