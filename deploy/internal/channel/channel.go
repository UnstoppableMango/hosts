package channel

func Map[T, V any](in <-chan T, f func(T) V) <-chan V {
	out := make(chan V)

	go func() {
		for x := range in {
			out <- f(x)
		}
		close(out)
	}()

	return out
}
