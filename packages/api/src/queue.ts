/**
 * https://stackoverflow.com/a/49902604/14978493
 */
export class Queue<T> {
    get length() {
        return this._size
    }

    public isEmpty() {
        return this.length === 0
    }

    public enqueue(...elems: T[]) {
        for (const elem of elems) {
            if (this.bottom.full()) {
                this.bottom = this.bottom.next = new Subqueue<T>()
            }
            this.bottom.enqueue(elem)
        }

        this._size += elems.length
    }

    public dequeue(): T | undefined {
        if (this._size === 0) {
            return undefined
        }

        const val = this.top.dequeue()
        this._size--
        if (this._size > 0 && this.top.size === 0 && this.top.full()) {
            // Discard current subqueue and point top to the one after
            this.top = this.top.next!
        }
        return val
    }

    public peek(): T | undefined {
        return this.top.peek()
    }

    public last(): T | undefined {
        return this.bottom.last()
    }

    public clear() {
        this.bottom = this.top = new Subqueue()
        this._size = 0
    }

    private top: Subqueue<T> = new Subqueue()
    private bottom: Subqueue<T> = this.top
    private _size = 0
}

/** Queue contains a linked list of Subqueue */
class Subqueue<T> {
    public full() {
        return this.array.length >= 1000
    }

    public get size() {
        return this.array.length - this.index
    }

    public peek(): T | undefined {
        return this.array[this.index]
    }

    public last(): T | undefined {
        return this.array[this.array.length - 1]
    }

    public dequeue(): T | undefined {
        return this.array[this.index++]
    }

    public enqueue(elem: T) {
        this.array.push(elem)
    }

    private index = 0
    private array: T[] = []

    public next: Subqueue<T> | undefined = undefined
}
