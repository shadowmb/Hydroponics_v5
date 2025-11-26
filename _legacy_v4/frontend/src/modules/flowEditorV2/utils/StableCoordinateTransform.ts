/**
 * 📦 FlowEditor v3 - Stable Coordinate Transform
 * ✅ Част от основната редакторна система
 * Централизирани coordinate transformations
 * Последна проверка: 2025-01-26
 */

/**
 * Базирано на legacy FlowEditor логиката, която работи стабилно при всички zoom нива.
 * Заменя разпространените coordinate transformations с една централизирана система.
 */

export interface Position {
  x: number;
  y: number;
}

export interface CanvasState {
  zoom: number;
  pan: Position;
}

/**
 * Стабилна координатна система базирана на legacy FlowEditor принципи
 * Ключов принцип: "Минимална математика, максимална консистентност"
 */
export class StableCoordinateTransform {
  
  /**
   * ОСНОВНА ФУНКЦИЯ - screen to canvas transformation
   * Използва простата legacy формула: (clientX - rect.left) / zoom
   * 
   * @param screenPos - mouse event координати (clientX, clientY)
   * @param containerRect - getBoundingClientRect() на canvas контейнера
   * @param zoom - текущия zoom level (1.0 = 100%)
   * @returns canvas координати, нормализирани за zoom
   */
  static screenToCanvas(
    screenPos: Position,
    containerRect: DOMRect,
    zoom: number
  ): Position {
    return {
      x: (screenPos.x - containerRect.left) / zoom,
      y: (screenPos.y - containerRect.top) / zoom
    };
  }

  /**
   * Обратна трансформация - canvas to screen coordinates
   * @param canvasPos - логическите canvas координати
   * @param containerRect - getBoundingClientRect() на canvas контейнера
   * @param zoom - текущия zoom level
   * @returns screen координати
   */
  static canvasToScreen(
    canvasPos: Position,
    containerRect: DOMRect,
    zoom: number
  ): Position {
    return {
      x: canvasPos.x * zoom + containerRect.left,
      y: canvasPos.y * zoom + containerRect.top
    };
  }

  /**
   * Помощна функция за извличане на координати от mouse event
   * @param event - mouse event
   * @param containerElement - DOM елементът на canvas контейнера
   * @param zoom - текущия zoom level
   * @returns canvas координати или null при грешка
   */
  static fromMouseEvent(
    event: MouseEvent,
    containerElement: Element | null,
    zoom: number
  ): Position | null {
    if (!event || !containerElement) return null;

    const rect = containerElement.getBoundingClientRect();
    const screenPos = { x: event.clientX, y: event.clientY };
    
    return this.screenToCanvas(screenPos, rect, zoom);
  }

  /**
   * Помощна функция за валидиране на координати
   * Помага при debugging на coordinate transformation проблеми
   */
  static validatePosition(pos: Position, context: string = 'position'): boolean {
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && 
        !isNaN(pos.x) && !isNaN(pos.y)) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Debug функция за проследяване на coordinate transformations
   * Полезна при отстраняване на zoom проблеми
   */
  static debugTransformation(
    screenPos: Position,
    containerRect: DOMRect,
    zoom: number,
    context: string = 'transformation'
  ): Position {
    const canvasPos = this.screenToCanvas(screenPos, containerRect, zoom);
    

    return canvasPos;
  }
}

/**
 * Convenience функция за директна употреба
 * Извличане на canvas координати от mouse event
 */
export function mouseToCanvas(
  event: MouseEvent,
  canvasElement: Element | null,
  zoom: number
): Position | null {
  return StableCoordinateTransform.fromMouseEvent(event, canvasElement, zoom);
}

/**
 * Convenience функция за canvas style генериране
 * Гарантира консистентност с legacy FlowEditor стил
 */
export function getStableCanvasStyle(zoom: number) {
  return {
    // ТОЧНО като legacy: само scale без pan
    transform: `scale(${zoom})`,
    transformOrigin: 'top left', // КРИТИЧНО - като в legacy
  };
}

/**
 * Extended версия за pan support (flowEditorV2 style)
 */
export function getStableCanvasStyleWithPan(zoom: number, pan: Position) {
  return {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: '0 0',
  };
}

/**
 * Delta calculation за drag operations
 * Изчислява разликата между две screen позиции в canvas координати
 */
export function calculateCanvasDelta(
  currentEvent: MouseEvent,
  lastPosition: Position,
  zoom: number
): Position {
  return {
    x: (currentEvent.clientX - lastPosition.x) / zoom,
    y: (currentEvent.clientY - lastPosition.y) / zoom
  };
}