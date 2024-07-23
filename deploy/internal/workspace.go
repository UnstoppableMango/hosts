package hosts

import (
	"context"
	"log/slog"
	"os"
	"path"
	"strings"

	"github.com/blang/semver"
	"github.com/pulumi/pulumi/sdk/v3/go/auto"
)

type Workspace interface {
	GetHost(context.Context, string) (Host, error)
}

type WorkspaceOptions struct {
	pulumi auto.Workspace
	Root   string
	Logger *slog.Logger
}

func NewWorkspace(ctx context.Context, opts *WorkspaceOptions) (Workspace, error) {
	root := opts.Root
	log := opts.Logger

	log.Info("Reading pulumi version")
	versionFile := path.Join(root, ".versions", "pulumi")
	versionBytes, err := os.ReadFile(versionFile)
	if err != nil {
		return nil, err
	}

	version := strings.TrimSpace(string(versionBytes))
	log.Info("Pulumi version", "version", version)

	binDir := path.Join(root, "bin", "pulumi")
	log.Info("Install pulumi command", "binDir", binDir)
	installPulumi, err := auto.InstallPulumiCommand(ctx, &auto.PulumiCommandOptions{
		Version: semver.MustParse(version),
		Root:    binDir,
	})
	if err != nil {
		return nil, err
	}

	programPath := path.Join(root, "packages", "hosts")
	// installDeps, err := auto.NewPulumiCommand(&auto.PulumiCommandOptions{
	// 	Version: semver.MustParse(version),
	// 	Root:    "",
	// })
	// if err != nil {
	// 	return err
	// }

	log.Info("Creating workspace/installing", "programPath", programPath)
	work, err := auto.NewLocalWorkspace(ctx,
		auto.WorkDir(programPath),
		auto.Pulumi(installPulumi),
	)
	if err != nil {
		return nil, err
	}

	opts.pulumi = work

	return opts, nil
}

// GetHost implements Workspace.
func (w *WorkspaceOptions) GetHost(ctx context.Context, name string) (Host, error) {
	w.Logger.Info("Creating host")
	return NewHost(ctx, name, &HostOpts{WorkspaceOptions: *w})
}
