/**
 * 「我的任务」模拟数据模块
 *
 * 本轮不接入后端任务接口，用一份轻量的前端模拟数据跑通交互：
 * - 任务列表、新建任务、按 ID 查任务、材料样例都集中在本模块；
 * - 任务数据与列表筛选条件（企业名称搜索词 + 任务状态）一起存入 sessionStorage：
 *   同一浏览器标签页内刷新列表 / 工作台仍能取到，新标签页（新会话）重新初始化为种子样例；
 * - 列表页与核对工作台都从本模块取数，保证两边看到的是同一份数据。
 *
 * 下一阶段接入真实任务接口时，替换本模块的读写实现即可，页面调用方式不变。
 *
 * @module mock/tasks
 */
import { reactive } from 'vue'

/** 任务状态：待核对 / 核对中 / 已完成 */
export type TaskStatus = 'pending' | 'in_review' | 'completed'

/** 客户类型：一般 / 小微 / 科创 */
export type CustomerType = 'general' | 'small' | 'tech'

/** 材料类型：公司章程 / 营业执照 / 财务报表 */
export type MaterialType = 'charter' | 'license' | 'financial'

/** 任务关联的材料 */
export interface TaskMaterial {
  /** 材料 ID */
  id: string
  /** 材料名称 */
  name: string
  /** 材料类型 */
  type: MaterialType
}

/** 一条授信核对任务 */
export interface ReviewTask {
  /** 任务 ID */
  id: string
  /** 企业名称 */
  companyName: string
  /** 客户类型 */
  customerType: CustomerType
  /** 任务状态 */
  status: TaskStatus
  /** 创建时间（ISO 字符串） */
  createdAt: string
  /** 关联材料（新建任务允许没有材料） */
  materials: TaskMaterial[]
}

/** 列表筛选条件 */
export interface TaskListQuery {
  /** 企业名称搜索词（子串匹配，忽略首尾空格） */
  companyName: string
  /** 任务状态筛选，'all' 表示全部 */
  status: TaskStatus | 'all'
}

/** sessionStorage 中的存储结构 */
interface TaskMockState {
  /** 任务数据（新的在前） */
  tasks: ReviewTask[]
  /** 列表筛选条件 */
  query: TaskListQuery
}

/** sessionStorage 键名 */
const STORAGE_KEY = 'compliance-task-mock'

/** 任务状态文案 */
export const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  pending: '待核对',
  in_review: '核对中',
  completed: '已完成'
}

/** 任务状态对应的标签色 */
export const TASK_STATUS_TAG: Record<TaskStatus, 'warning' | 'primary' | 'success'> = {
  pending: 'warning',
  in_review: 'primary',
  completed: 'success'
}

/** 客户类型文案 */
export const CUSTOMER_TYPE_TEXT: Record<CustomerType, string> = {
  general: '一般',
  small: '小微',
  tech: '科创'
}

/** 材料类型文案 */
export const MATERIAL_TYPE_TEXT: Record<MaterialType, string> = {
  charter: '公司章程',
  license: '营业执照',
  financial: '财务报表'
}

/** 状态筛选可选项 */
export const TASK_STATUS_OPTIONS: { label: string; value: TaskStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待核对', value: 'pending' },
  { label: '核对中', value: 'in_review' },
  { label: '已完成', value: 'completed' }
]

/** 客户类型可选项 */
export const CUSTOMER_TYPE_OPTIONS: { label: string; value: CustomerType }[] = [
  { label: '一般', value: 'general' },
  { label: '小微', value: 'small' },
  { label: '科创', value: 'tech' }
]

/** 默认筛选条件 */
const DEFAULT_QUERY: TaskListQuery = { companyName: '', status: 'all' }

/**
 * 种子样例
 * 覆盖待核对 / 核对中 / 已完成三种状态，并包含一条关联多份材料的样例。
 */
const SEED_TASKS: ReviewTask[] = [
  {
    id: 'T2026001',
    companyName: '华信资本管理有限公司',
    customerType: 'general',
    status: 'pending',
    createdAt: '2026-11-18T09:24:00.000Z',
    materials: [
      { id: 'M2026001-1', name: '公司章程', type: 'charter' },
      { id: 'M2026001-2', name: '营业执照', type: 'license' }
    ]
  },
  {
    id: 'T2026002',
    companyName: '云启智能科技（上海）有限公司',
    customerType: 'tech',
    status: 'pending',
    createdAt: '2026-11-17T14:08:00.000Z',
    materials: []
  },
  {
    id: 'T2026003',
    companyName: '瑞丰小额贷款有限公司',
    customerType: 'small',
    status: 'in_review',
    createdAt: '2026-11-16T03:42:00.000Z',
    materials: [
      { id: 'M2026003-1', name: '公司章程', type: 'charter' },
      { id: 'M2026003-2', name: '财务报表', type: 'financial' }
    ]
  },
  {
    id: 'T2026004',
    companyName: '恒基建材集团股份有限公司',
    customerType: 'general',
    status: 'completed',
    createdAt: '2026-11-14T08:15:00.000Z',
    materials: [
      { id: 'M2026004-1', name: '公司章程', type: 'charter' },
      { id: 'M2026004-2', name: '营业执照', type: 'license' },
      { id: 'M2026004-3', name: '财务报表', type: 'financial' }
    ]
  }
]

/**
 * 从 sessionStorage 读取状态，失败或首次进入时回退到种子样例
 */
function loadState(): TaskMockState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as TaskMockState
      if (Array.isArray(parsed?.tasks)) {
        return {
          tasks: parsed.tasks,
          query: { ...DEFAULT_QUERY, ...(parsed.query || {}) }
        }
      }
    }
  } catch (error) {
    console.warn('[MockTasks] 读取 sessionStorage 失败，回退到种子样例', error)
  }

  return { tasks: [...SEED_TASKS], query: { ...DEFAULT_QUERY } }
}

/**
 * 写回 sessionStorage
 */
function saveState(state: TaskMockState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('[MockTasks] 写入 sessionStorage 失败', error)
  }
}

/** 模块级共享状态：列表页与工作台读写的是同一份数据 */
const state = reactive<TaskMockState>(loadState())

/**
 * 保存筛选条件
 */
export function setListQuery(query: TaskListQuery): void {
  state.query = { companyName: query.companyName ?? '', status: query.status ?? 'all' }
  saveState(state)
}

/**
 * 读取筛选条件
 */
export function getListQuery(): TaskListQuery {
  return { ...state.query }
}

/**
 * 判断任务是否命中筛选条件
 * 企业名称按子串匹配并忽略首尾空格；状态为 'all' 时不限
 */
export function matchTask(task: ReviewTask, query: TaskListQuery): boolean {
  const keyword = (query.companyName || '').trim()
  if (keyword && !task.companyName.includes(keyword)) {
    return false
  }
  if (query.status && query.status !== 'all' && task.status !== query.status) {
    return false
  }
  return true
}

/**
 * 按筛选条件取任务列表（新的在前）
 */
export function listTasks(query: TaskListQuery = state.query): ReviewTask[] {
  return state.tasks.filter((task) => matchTask(task, query))
}

/**
 * 取全部任务（不筛选）
 */
export function listAllTasks(): ReviewTask[] {
  return [...state.tasks]
}

/**
 * 按 ID 查任务
 */
export function getTaskById(id: string): ReviewTask | undefined {
  return state.tasks.find((task) => task.id === id)
}

/**
 * 取任务关联的材料
 */
export function getTaskMaterials(id: string): TaskMaterial[] {
  return getTaskById(id)?.materials ?? []
}

/**
 * 判断任务是否已上传公司章程
 */
export function hasCharter(task: ReviewTask): boolean {
  return task.materials.some((material) => material.type === 'charter')
}

/**
 * 生成任务 ID
 */
function generateTaskId(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `T${stamp}${random}`
}

/**
 * 新建任务
 *
 * 新任务统一为「待核对」，使用独立 ID 与实际创建时间，出现在列表顶部；
 * 本轮新建任务允许没有材料。
 */
export function createTask(input: {
  companyName: string
  customerType: CustomerType
}): ReviewTask {
  const task: ReviewTask = {
    id: generateTaskId(),
    companyName: input.companyName.trim(),
    customerType: input.customerType,
    status: 'pending',
    createdAt: new Date().toISOString(),
    materials: []
  }

  state.tasks.unshift(task)
  saveState(state)
  return task
}

/**
 * 格式化创建时间
 */
export function formatTaskTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
