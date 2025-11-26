/**
 * 📦 FlowEditor v3 - Coordinate Transform
 * ✅ Част от основната редакторна система
 * Централизирана система за coordinate transformations
 * Последна проверка: 2025-01-26
 */

/**
 * Решава проблема с несъответствието в координатните системи при zoom операции
 * чрез единна точка на истина за всички coordinate transformations.
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
 * Централизирана класа за координатни преобразувания
 * Използва правилната формула: (client - container - pan) / zoom
 */
export class CoordinateTransform {
  /**
   * Преобразува screen координати (от mouse event) в canvas координати
   * @param screenPos - позицията от mouse event (clientX, clientY)
   * @param containerRect - getBoundingClientRect() на canvas контейнера
   * @param canvasState - текущото състояние на canvas (zoom, pan)
   * @returns canvas координати, нормализирани за zoom и pan
   */
  static screenToCanvas(
    screenPos: Position,
    containerRect: DOMRect,
    canvasState: CanvasState
  ): Position {
    // ПРАВИЛНА ФОРМУЛА: първо компенсира pan, после де-мащабира
    return {
      x: (screenPos.x - containerRect.left - canvasState.pan.x) / canvasState.zoom,
      y: (screenPos.y - containerRect.top - canvasState.pan.y) / canvasState.zoom
    };
  }

  /**
   * Преобразува canvas координати в screen координати за DOM позициониране
   * @param canvasPos - логическите canvas координати
   * @param containerRect - getBoundingClientRect() на canvas контейнера
   * @param canvasState - текущото състояние на canvas (zoom, pan)
   * @returns screen координати за позициониране на DOM елементи
   */
  static canvasToScreen(
    canvasPos: Position,
    containerRect: DOMRect,
    canvasState: CanvasState
  ): Position {
    return {
      x: canvasPos.x * canvasState.zoom + canvasState.pan.x + containerRect.left,
      y: canvasPos.y * canvasState.zoom + canvasState.pan.y + containerRect.top
    };
  }

  /**
   * Помощна функция - преобразува mouse event директно в canvas координати
   * @param event - mouse event с clientX, clientY
   * @param containerElement - DOM елементът на canvas контейнера
   * @param canvasState - текущото състояние на canvas
   * @returns canvas координати
   */
  static mouseEventToCanvas(
    event: MouseEvent,
    containerElement: Element,
    canvasState: CanvasState
  ): Position {
    const rect = containerElement.getBoundingClientRect();
    return this.screenToCanvas(
      { x: event.clientX, y: event.clientY },
      rect,
      canvasState
    );
  }

  /**
   * Проверява валидността на координати - полезно за debugging
   * @param pos - координати за проверка
   * @param context - опционален контекст за debug съобщения
   * @returns true ако координатите са валидни
   */
  static validateCoordinates(pos: Position, context: string = ''): boolean {
    if (pos.x == null || pos.y == null || !isFinite(pos.x) || !isFinite(pos.y)) {
      return false;
    }
    return true;
  }

  /**
   * Debug функция - следи стъпките на coordinate transformation
   * @param label - етикет за debug съобщението
   * @param screenPos - стартови screen координати
   * @param containerRect - rect на canvas контейнера
   * @param canvasState - състояние на canvas
   * @returns резултатни canvas координати
   */
  static debugTransform(
    label: string,
    screenPos: Position,
    containerRect: DOMRect,
    canvasState: CanvasState
  ): Position {
    const canvasPos = this.screenToCanvas(screenPos, containerRect, canvasState);
    
    
    return canvasPos;
  }
}

/**
 * Legacy функция за съвместимост с стар код - ще бъде заменена с CoordinateTransform
 * @param clientX - X координата от mouse event
 * @param clientY - Y координата от mouse event
 * @param containerRect - bounding rect на контейнера
 * @param zoom - zoom ниво
 * @param panX - X pan offset
 * @param panY - Y pan offset
 * @returns canvas координати
 */
export function screenToCanvasCoordinates(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  zoom: number,
  panX: number,
  panY: number
): Position {
  return CoordinateTransform.screenToCanvas(
    { x: clientX, y: clientY },
    containerRect,
    { zoom, pan: { x: panX, y: panY } }
  );
}