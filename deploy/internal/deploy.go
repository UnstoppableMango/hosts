package hosts

import (
	"context"
	"fmt"
	"log/slog"

	"golang.org/x/sync/errgroup"
)

type Op string

type DeployOpts struct {
	Op                     Op
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

	err = runner.deployHosts(ctx, opts.ControlPlanes)
	if err != nil {
		return err
	}

	return runner.deployHosts(ctx, opts.Workers)
}

func (o *operation) deployHosts(ctx context.Context, hosts []string) error {
	errs, ctx := errgroup.WithContext(ctx)
	for _, name := range hosts {
		errs.Go(func() error {
			o.log.Debug("Creating host")
			host, err := o.work.GetHost(ctx, name)
			if err != nil {
				return err
			}

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
