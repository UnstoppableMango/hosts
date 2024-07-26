package hosts

import (
	"context"
	"fmt"
	"log/slog"

	"golang.org/x/exp/maps"
	"golang.org/x/sync/errgroup"
)

type Op string

type DeployOpts struct {
	ControlPlanes, Workers []string
	Logger                 *slog.Logger
}

type operation struct {
	opts DeployOpts
	op   Op
	work Workspace
	log  *slog.Logger
}

var (
	Down    Op = "down"
	Preview Op = "preview"
	Up      Op = "up"
)

func Deploy(ctx context.Context, op Op, opts *DeployOpts) error {
	runner, err := opts.getOp(ctx, op)
	if err != nil {
		return err
	}

	if err = runner.deployHosts(ctx, opts.ControlPlanes); err != nil {
		return err
	}

	return runner.deployHosts(ctx, opts.Workers)
}

func (o *operation) deployHosts(ctx context.Context, names []string) error {
	hosts, err := o.getHosts(ctx, names)
	if err != nil {
		return err
	}

	if err = o.runHosts(ctx, maps.Values(hosts)); err != nil {
		return o.cancelHosts(ctx, maps.Values(hosts))
	}

	return nil
}

func (o *operation) getHosts(ctx context.Context, names []string) (map[string]Host, error) {
	errs, ctx := errgroup.WithContext(ctx)
	res := map[string]Host{}

	for _, name := range names {
		errs.Go(func() error {
			o.log.Debug("Creating host")
			host, err := o.work.GetHost(ctx, name)
			if err != nil {
				return err
			}

			res[name] = host
			return nil
		})
	}

	return res, errs.Wait()
}

func (o *operation) runHosts(ctx context.Context, hosts []Host) error {
	errs, ctx := errgroup.WithContext(ctx)

	for _, host := range hosts {
		errs.Go(func() error {
			switch o.op {
			case Down:
				return host.Down(ctx)
			case Preview:
				return host.Preview(ctx)
			case Up:
				return host.Up(ctx)
			}

			return fmt.Errorf("unsupported op: %s", o.op)
		})
	}

	return errs.Wait()
}

func (o *operation) cancelHosts(ctx context.Context, hosts []Host) error {
	errs, ctx := errgroup.WithContext(ctx)

	for _, host := range hosts {
		errs.Go(func() error {
			return host.Cancel(ctx)
		})
	}

	return errs.Wait()
}

func (opts DeployOpts) getOp(ctx context.Context, op Op) (*operation, error) {
	log := opts.Logger.With("op", op)
	root, err := RepoPath()
	if err != nil {
		return nil, err
	}

	workspace, err := NewWorkspace(ctx, &WorkspaceOptions{
		Root:   root,
		Logger: log,
	})
	if err != nil {
		return nil, err
	}

	return &operation{
		opts: opts,
		op:   op,
		work: workspace,
		log:  log,
	}, nil
}
